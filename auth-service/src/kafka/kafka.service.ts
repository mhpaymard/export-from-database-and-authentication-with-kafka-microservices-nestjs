import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
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
    const value = message.value?.toString();

    if (!value) {
      this.logger.warn('Received empty message');
      return;
    }

    try {
      const request = JSON.parse(value);
      this.logger.log(`Processing message: ${request.action} (correlationId: ${request.correlationId})`);

      let response: any;

      switch (request.action) {
        case 'register':
          response = await this.authService.register(request.data);
          break;

        case 'login':
          response = await this.authService.login(request.data);
          break;

        case 'profile':
        case 'validate':
          const token = request.token || request.data?.token;
          if (!token) {
            throw new Error('Token is required');
          }
          response = await this.authService.validateToken(token);
          break;

        default:
          throw new Error(`Unknown action: ${request.action}`);
      }

      await this.sendResponse(request.correlationId, { success: true, data: response });
    } catch (error) {
      this.logger.error('Error processing message', error);
      
      const request = JSON.parse(value);
      await this.sendResponse(request.correlationId, {
        success: false,
        error: error.message || 'Internal server error',
        statusCode: error.status || 500,
      });
    }
  }

  private async sendResponse(correlationId: string, data: any) {
    const responseTopic = this.configService.get<string>('KAFKA_AUTH_RESPONSE_TOPIC');

    try {
      await this.producer.send({
        topic: responseTopic,
        messages: [
          {
            key: correlationId,
            value: JSON.stringify({
              correlationId,
              ...data,
            }),
          },
        ],
      });

      this.logger.log(`Response sent for correlationId: ${correlationId}`);
    } catch (error) {
      this.logger.error('Failed to send response', error);
    }
  }
}
