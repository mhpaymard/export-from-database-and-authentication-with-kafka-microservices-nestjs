import { Module, forwardRef } from '@nestjs/common';
import { ExportController } from './export-sse.controller';
import { JobStoreService } from './job-store.service';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [forwardRef(() => KafkaModule)],
  controllers: [ExportController],
  providers: [JobStoreService],
  exports: [JobStoreService],
})
export class ExportModule {}
