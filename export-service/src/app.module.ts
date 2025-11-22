import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtVerifyService } from './auth/jwt-verify.service';
import { ExportService } from './export/export.service';
import { QueryBuilderService } from './export/query-builder.service';
import { FileGeneratorService } from './export/file-generator.service';
import { KafkaService } from './kafka/kafka.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres123',
      database: 'microservices_db',
      entities: [],
      synchronize: false, // No entities to sync, read-only queries
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtVerifyService,
    QueryBuilderService,
    FileGeneratorService,
    ExportService,
    KafkaService,
  ],
})
export class AppModule {}
