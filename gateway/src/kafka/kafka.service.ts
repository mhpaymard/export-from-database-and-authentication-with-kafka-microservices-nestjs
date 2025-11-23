import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { ProtoService } from '../proto/proto.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private pendingRequests: Map<string, {resolve: Function, reject: Function, timeoutId: NodeJS.Timeout}> = new Map();

  constructor(private readonly protoService: ProtoService) {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'api-gateway',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: parseInt(process.env.KAFKA_RETRY_ATTEMPTS || '3'),
      },
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.connect();
    // Start permanent consumers for response topics
    await this.startResponseConsumers();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      await this.producer.connect();
      this.logger.log('✅ Kafka Producer connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect Kafka Producer:', error.message);
      throw error;
    }
  }

  private async startResponseConsumers() {
    // Consumer for auth.response
    const authConsumer = this.kafka.consumer({
      groupId: 'gateway-auth-response-group',
    });
    
    await authConsumer.connect();
    await authConsumer.subscribe({ topic: 'auth.response', fromBeginning: false });
    
    await authConsumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        try {
          // Extract correlationId from headers
          const correlationId = message.headers?.correlationId?.toString();
          
          if (!correlationId) {
            this.logger.warn('Received auth response without correlationId');
            return;
          }

          // Decode protobuf message based on message type from headers
          const messageType = message.headers?.messageType?.toString();
          let response: any;

          switch (messageType) {
            case 'RegisterResponse':
              response = this.protoService.decode(this.protoService.RegisterResponse, Buffer.from(message.value));
              break;
            case 'LoginResponse':
              response = this.protoService.decode(this.protoService.LoginResponse, Buffer.from(message.value));
              break;
            case 'VerifyTokenResponse':
              response = this.protoService.decode(this.protoService.VerifyTokenResponse, Buffer.from(message.value));
              break;
            default:
              this.logger.warn(`Unknown auth message type: ${messageType}`);
              return;
          }

          this.logger.debug(`Received auth response for correlationId: ${correlationId}`);
          
          const pending = this.pendingRequests.get(correlationId);
          if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingRequests.delete(correlationId);
            
            if (response.success === false || response.error) {
              pending.reject(new Error(response.error || 'Request failed'));
            } else {
              // Resolve with full response object
              pending.resolve(response);
            }
          }
        } catch (error) {
          this.logger.error('Error processing auth response:', error.message);
        }
      },
    });
    
    this.consumers.set('auth.response', authConsumer);
    this.logger.log('✅ Permanent consumer started for auth.response');

    // Consumer for export.response
    const exportConsumer = this.kafka.consumer({
      groupId: 'gateway-export-response-group',
    });
    
    await exportConsumer.connect();
    await exportConsumer.subscribe({ topic: 'export.response', fromBeginning: false });
    
    await exportConsumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        try {
          // Extract correlationId from headers
          const correlationId = message.headers?.correlationId?.toString();
          
          if (!correlationId) {
            this.logger.warn('Received export response without correlationId');
            return;
          }

          // Decode protobuf message based on message type from headers
          const messageType = message.headers?.messageType?.toString();
          let response: any;

          switch (messageType) {
            case 'ExportQueryResponse':
              response = this.protoService.decode(this.protoService.ExportQueryResponse, Buffer.from(message.value));
              break;
            case 'SchemaResponse':
              response = this.protoService.decode(this.protoService.SchemaResponse, Buffer.from(message.value));
              break;
            default:
              this.logger.warn(`Unknown export message type: ${messageType}`);
              return;
          }

          this.logger.debug(`Received export response for correlationId: ${correlationId}`);
          
          const pending = this.pendingRequests.get(correlationId);
          if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingRequests.delete(correlationId);
            
            if (response.success === false || response.error) {
              pending.reject(new Error(response.error || 'Request failed'));
            } else {
              // Resolve with full response object
              pending.resolve(response);
            }
          }
        } catch (error) {
          this.logger.error('Error processing export response:', error.message);
        }
      },
    });
    
    this.consumers.set('export.response', exportConsumer);
    this.logger.log('✅ Permanent consumer started for export.response');
  }

  private async disconnect() {
    try {
      await this.producer.disconnect();
      
      for (const [topic, consumer] of this.consumers.entries()) {
        await consumer.disconnect();
        this.logger.log(`Disconnected consumer for topic: ${topic}`);
      }
      
      this.logger.log('Kafka connections closed');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka:', error.message);
    }
  }

  /**
   * Send a message to Kafka topic
   */
  async sendMessage(topic: string, message: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: this.generateMessageKey(),
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });

      this.logger.debug(`Message sent to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send message to ${topic}:`, error.message);
      throw error;
    }
  }

  /**
   * Send a request and wait for response (Request-Reply Pattern with Protobuf)
   */
  async sendRequest<T = any>(
    requestTopic: string,
    responseTopic: string,
    payload: any,
    messageType: string,
    timeout: number = 30000,
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const correlationId = this.generateCorrelationId();
      
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      // Store the pending request
      this.pendingRequests.set(correlationId, { resolve, reject, timeoutId });

      try {
        // Select the appropriate protobuf message type
        let protoType: any;
        switch (messageType) {
          case 'RegisterRequest':
            protoType = this.protoService.RegisterRequest;
            break;
          case 'LoginRequest':
            protoType = this.protoService.LoginRequest;
            break;
          case 'VerifyTokenRequest':
            protoType = this.protoService.VerifyTokenRequest;
            break;
          case 'ExportQueryRequest':
            protoType = this.protoService.ExportQueryRequest;
            break;
          case 'SchemaRequest':
            protoType = this.protoService.SchemaRequest;
            break;
          default:
            throw new Error(`Unknown message type: ${messageType}`);
        }

        // Encode the payload to protobuf binary
        const encodedPayload = this.protoService.encode(protoType, payload);

        // Send the request with correlationId and messageType in headers
        await this.producer.send({
          topic: requestTopic,
          messages: [
            {
              key: correlationId,
              value: encodedPayload,
              headers: {
                correlationId,
                messageType,
                timestamp: Date.now().toString(),
              },
            },
          ],
        });

        this.logger.debug(`Request sent to ${requestTopic} with correlationId: ${correlationId}, messageType: ${messageType}`);
      } catch (error) {
        clearTimeout(timeoutId);
        this.logger.error(`Error in sendRequest to ${requestTopic}:`, error.message);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to a topic with a message handler
   */
  async subscribe(
    topic: string,
    groupId: string,
    handler: (message: any) => Promise<void>,
  ): Promise<void> {
    try {
      const consumer = this.kafka.consumer({ groupId });
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
          try {
            const payload = JSON.parse(message.value?.toString() || '{}');
            await handler(payload);
          } catch (error) {
            this.logger.error(`Error handling message from ${topic}:`, error.message);
          }
        },
      });

      this.consumers.set(topic, consumer);
      this.logger.log(`✅ Subscribed to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to ${topic}:`, error.message);
      throw error;
    }
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageKey(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
