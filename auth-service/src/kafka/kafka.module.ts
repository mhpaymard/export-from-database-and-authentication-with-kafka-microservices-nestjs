import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
