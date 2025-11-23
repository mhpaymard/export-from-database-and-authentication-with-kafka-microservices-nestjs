import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { ExportService } from '../export/export.service';
import { ExportQueryDto } from '../export/dto/export-query.dto';
import { ProtoService } from '../proto/proto.service';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor(
    private readonly exportService: ExportService,
    private readonly protoService: ProtoService,
  ) {
    this.kafka = new Kafka({
      clientId: 'export-service',
      brokers: ['localhost:9092'],
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'export-service-group' });
  }

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();
    await this.startRequestConsumer();
    this.logger.log('✅ Kafka producer and consumer connected');
  }

  /**
   * Start permanent consumer for export.request (BEST PRACTICE)
   */
  private async startRequestConsumer() {
    await this.consumer.subscribe({ topic: 'export.request', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) {
          this.logger.warn('⚠️ Received message without value');
          return;
        }
        
        try {
          // Extract correlationId and messageType from headers
          const correlationId = message.headers?.correlationId?.toString();
          const messageType = message.headers?.messageType?.toString();
          
          if (!correlationId || !messageType) {
            this.logger.warn('⚠️ Received message without correlationId or messageType in headers');
            return;
          }
          
          this.logger.log(`📨 Received ${messageType}: correlationId=${correlationId}`);

          let request: any;
          let result: any;
          let responseType: string;

          // Decode protobuf message based on messageType
          switch (messageType) {
            case 'ExportQueryRequest':
              request = this.protoService.decode(this.protoService.ExportQueryRequest, Buffer.from(message.value));
              result = await this.exportService.processExportRequest(request as ExportQueryDto);
              responseType = 'ExportQueryResponse';
              break;

            case 'SchemaRequest':
              request = this.protoService.decode(this.protoService.SchemaRequest, Buffer.from(message.value));
              const schema = await this.exportService.getDatabaseSchema();
              result = {
                success: true,
                schema: schema,  // استفاده از schema به جای tables
              };
              responseType = 'SchemaResponse';
              break;

            default:
              throw new Error(`Unknown message type: ${messageType}`);
          }

          // Send response back
          await this.sendResponse(correlationId, responseType, result);
          
        } catch (error) {
          this.logger.error(`❌ Error processing request: ${error.message}`, error.stack);
          
          const correlationId = message.headers?.correlationId?.toString() || 'unknown';
          const messageType = message.headers?.messageType?.toString();
          
          // Determine response type based on request type
          let responseType: string;
          if (messageType === 'ExportQueryRequest') responseType = 'ExportQueryResponse';
          else if (messageType === 'SchemaRequest') responseType = 'SchemaResponse';
          else responseType = 'ErrorResponse';
          
          // Send error response
          await this.sendResponse(correlationId, responseType, {
            success: false,
            error: error.message || 'Internal server error',
          });
        }
      },
    });

    this.logger.log('✅ Permanent consumer started for export.request');
  }

  /**
   * Send response to export.response topic
   */
  private async sendResponse(correlationId: string, messageType: string, data: any) {
    try {
      // Select the appropriate protobuf message type for response
      let protoType: any;
      switch (messageType) {
        case 'ExportQueryResponse':
          protoType = this.protoService.ExportQueryResponse;
          break;
        case 'SchemaResponse':
          protoType = this.protoService.SchemaResponse;
          break;
        default:
          throw new Error(`Unknown response type: ${messageType}`);
      }

      // Encode the response to protobuf binary
      const encodedResponse = this.protoService.encode(protoType, data);

      await this.producer.send({
        topic: 'export.response',
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

      this.logger.log(`✅ Response sent for correlationId: ${correlationId}, messageType: ${messageType}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send response: ${error.message}`, error.stack);
    }
  }
}
