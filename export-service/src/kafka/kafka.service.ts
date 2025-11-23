import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { ExportService } from '../export/export.service';
import { ExportQueryDto } from '../export/dto/export-query.dto';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor(private readonly exportService: ExportService) {
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
          const payload = JSON.parse(message.value.toString());
          
          // correlationId is in the PAYLOAD, not in headers!
          const correlationId = payload.correlationId;
          
          if (!correlationId) {
            this.logger.warn('⚠️ Received message without correlationId in payload');
            return;
          }
          
          this.logger.log(`📨 Received export request: correlationId=${correlationId}`);

          // Check request type
          let result;
          if (payload.type === 'schema') {
            // Get database schema
            result = {
              success: true,
              schema: await this.exportService.getDatabaseSchema(),
            };
          } else {
            // Process export request
            result = await this.exportService.processExportRequest(payload as ExportQueryDto);
          }

          // Send response back
          await this.sendResponse(correlationId, result);
          
        } catch (error) {
          this.logger.error(`❌ Error processing request: ${error.message}`, error.stack);
          
          // Try to get correlationId from error context
          const errorPayload = error.payload || {};
          const errorCorrelationId = errorPayload.correlationId || 'unknown';
          
          // Send error response
          await this.sendResponse(errorCorrelationId, {
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
  private async sendResponse(correlationId: string, data: any) {
    try {
      await this.producer.send({
        topic: 'export.response',
        messages: [
          {
            key: correlationId,
            value: JSON.stringify({
              correlationId, // Add correlationId to payload
              ...data,
            }),
            headers: { correlationId },
          },
        ],
      });

      this.logger.log(`✅ Response sent for correlationId: ${correlationId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send response: ${error.message}`, error.stack);
    }
  }
}
