import { Module, Global, forwardRef } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { ExportModule } from '../export/export.module';

@Global()
@Module({
  imports: [forwardRef(() => ExportModule)],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
