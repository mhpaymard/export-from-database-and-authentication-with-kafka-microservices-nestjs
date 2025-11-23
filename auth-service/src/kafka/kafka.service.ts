import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { AuthService } from '../auth/auth.service';
import { ProtoService } from '../proto/proto.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private protoService: ProtoService,
  ) {
    this.kafka = new Kafka({
      clientId: 'auth-service',
      brokers: [this.configService.get<string>('KAFKA_BROKER')],
    });

    this.consumer = this.kafka.consumer({ groupId: 'auth-service-group' });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.connect();
    await this.subscribe();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      await this.consumer.connect();
      await this.producer.connect();
      this.logger.log('Kafka consumer and producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      await this.consumer.disconnect();
      await this.producer.disconnect();
      this.logger.log('Kafka consumer and producer disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect from Kafka', error);
    }
  }

  private async subscribe() {
    const requestTopic = this.configService.get<string>('KAFKA_AUTH_REQUEST_TOPIC');
    
    try {
      await this.consumer.subscribe({ topic: requestTopic, fromBeginning: false });
      this.logger.log(`Subscribed to topic: ${requestTopic}`);

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
    } catch (error) {
      this.logger.error('Failed to subscribe to Kafka topic', error);
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload) {
    const { topic, partition, message } = payload;
    
    if (!message.value) {
      this.logger.warn('Received empty message');
      return;
    }

    try {
      // Extract correlationId and messageType from headers
      const correlationId = message.headers?.correlationId?.toString();
      const messageType = message.headers?.messageType?.toString();

      if (!correlationId || !messageType) {
        this.logger.warn('Received message without correlationId or messageType in headers');
        return;
      }

      this.logger.log(`Processing ${messageType} (correlationId: ${correlationId})`);

      let request: any;
      let response: any;
      let responseType: string;

      // Decode protobuf message based on messageType
      switch (messageType) {
        case 'RegisterRequest':
          request = this.protoService.decode(this.protoService.RegisterRequest, Buffer.from(message.value));
          response = await this.authService.register(request);
          responseType = 'RegisterResponse';
          break;

        case 'LoginRequest':
          request = this.protoService.decode(this.protoService.LoginRequest, Buffer.from(message.value));
          response = await this.authService.login(request);
          responseType = 'LoginResponse';
          break;

        case 'VerifyTokenRequest':
          request = this.protoService.decode(this.protoService.VerifyTokenRequest, Buffer.from(message.value));
          response = await this.authService.validateToken(request.token);
          responseType = 'VerifyTokenResponse';
          break;

        default:
          throw new Error(`Unknown message type: ${messageType}`);
      }

      await this.sendResponse(correlationId, responseType, { success: true, ...response });
    } catch (error) {
      this.logger.error('Error processing message', error);
      
      const correlationId = message.headers?.correlationId?.toString();
      const messageType = message.headers?.messageType?.toString();
      
      if (correlationId && messageType) {
        // Determine response type based on request type
        let responseType: string;
        if (messageType === 'RegisterRequest') responseType = 'RegisterResponse';
        else if (messageType === 'LoginRequest') responseType = 'LoginResponse';
        else if (messageType === 'VerifyTokenRequest') responseType = 'VerifyTokenResponse';
        else responseType = 'ErrorResponse';

        await this.sendResponse(correlationId, responseType, {
          success: false,
          error: error.message || 'Internal server error',
        });
      }
    }
  }

  private async sendResponse(correlationId: string, messageType: string, data: any) {
    const responseTopic = this.configService.get<string>('KAFKA_AUTH_RESPONSE_TOPIC');

    try {
      // Select the appropriate protobuf message type for response
      let protoType: any;
      switch (messageType) {
        case 'RegisterResponse':
          protoType = this.protoService.RegisterResponse;
          break;
        case 'LoginResponse':
          protoType = this.protoService.LoginResponse;
          break;
        case 'VerifyTokenResponse':
          protoType = this.protoService.VerifyTokenResponse;
          break;
        default:
          throw new Error(`Unknown response type: ${messageType}`);
      }

      // Encode the response to protobuf binary
      const encodedResponse = this.protoService.encode(protoType, data);

      await this.producer.send({
        topic: responseTopic,
        messages: [
          {
            key: correlationId,
            value: encodedResponse,
            headers: {
              correlationId,
              messageType,
            },
          },
        ],
      });

      this.logger.log(`Response sent for correlationId: ${correlationId}, messageType: ${messageType}`);
    } catch (error) {
      this.logger.error('Failed to send response', error);
    }
  }
}
