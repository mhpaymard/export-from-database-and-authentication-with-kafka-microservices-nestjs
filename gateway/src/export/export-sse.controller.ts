import { 
  Controller, 
  Post,
  Get,
  Body, 
  Req, 
  Res,
  Param,
  HttpStatus,
  HttpException,
  Sse,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { KafkaService } from '../kafka/kafka.service';
import { JobStoreService, ExportJob } from './job-store.service';
import { ExportQueryDto } from './dto/export-query.dto';

interface MessageEvent {
  data: any;
  type?: string;
  id?: string;
  retry?: number;
}

@ApiTags('Export')
@Controller('api/export')
export class ExportController {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly jobStore: JobStoreService,
  ) {}

  @Post('query')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Submit export job (returns immediately with jobId)',
  })
  @ApiResponse({ 
    status: 202, 
    description: 'Job submitted successfully',
  })
  async submitExportJob(
    @Body() exportQueryDto: ExportQueryDto,
    @Req() req: Request,
  ) {
    const token = req.headers.authorization;
    
    if (!token) {
      throw new HttpException('Authorization token is required', HttpStatus.UNAUTHORIZED);
    }

    // Extract user info from token
    const tokenParts = token.split(' ')[1];
    const payload = JSON.parse(Buffer.from(tokenParts.split('.')[1], 'base64').toString());
    const userId = payload.sub;

    // Generate job ID
    const jobId = uuidv4();

    // Create job in store
    this.jobStore.createJob(jobId, userId);

    // Send to Kafka (non-blocking)
    this.kafkaService.sendRequest(
      'export.request',
      'export.response',
      {
        jobId,
        ...exportQueryDto,
        token,
      },
      300000, // 5 minutes
    ).then(result => {
      if (result.success) {
        this.jobStore.completeJob(jobId, {
          data: result.data,
          isBase64: result.isBase64,
          contentType: result.contentType,
          filename: result.filename,
          format: result.format || exportQueryDto.format,
        });
      } else {
        this.jobStore.failJob(jobId, result.error || 'Export failed');
      }
    }).catch(error => {
      this.jobStore.failJob(jobId, error.message || 'Export service error');
    });

    return {
      jobId,
      status: 'queued',
      streamUrl: `/api/export/stream/${jobId}`,
      downloadUrl: `/api/export/download/${jobId}`,
    };
  }

  @Get('stream/:jobId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stream export job progress (SSE)' })
  @ApiParam({ name: 'jobId' })
  @Sse('stream/:jobId')
  streamJobProgress(
    @Param('jobId') jobId: string,
    @Req() req: Request,
  ): Observable<MessageEvent> {
    const token = req.headers.authorization;
    
    if (!token) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const tokenParts = token.split(' ')[1];
    const payload = JSON.parse(Buffer.from(tokenParts.split('.')[1], 'base64').toString());
    const userId = payload.sub;

    const job = this.jobStore.getJob(jobId);
    
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    if (job.userId !== userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    const emitter = this.jobStore.getJobEmitter(jobId);
    
    if (!emitter) {
      throw new HttpException('Job stream not available', HttpStatus.NOT_FOUND);
    }

    return new Observable(observer => {
      // Send initial state
      observer.next({
        data: {
          jobId: job.jobId,
          status: job.status,
          progress: job.progress,
          message: job.message,
        },
        type: job.status === 'queued' ? 'started' : job.status,
      } as MessageEvent);

      // Listen for updates
      const updateHandler = (updatedJob: ExportJob) => {
        observer.next({
          data: {
            jobId: updatedJob.jobId,
            status: updatedJob.status,
            progress: updatedJob.progress,
            message: updatedJob.message,
            error: updatedJob.error,
          },
          type: updatedJob.status,
        } as MessageEvent);

        if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
          setTimeout(() => observer.complete(), 100);
        }
      };

      emitter.on('update', updateHandler);

      return () => {
        emitter.off('update', updateHandler);
      };
    });
  }

  @Get('download/:jobId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download completed export file' })
  @ApiParam({ name: 'jobId' })
  async downloadExport(
    @Param('jobId') jobId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const token = req.headers.authorization;
    
    if (!token) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const tokenParts = token.split(' ')[1];
    const payload = JSON.parse(Buffer.from(tokenParts.split('.')[1], 'base64').toString());
    const userId = payload.sub;

    const job = this.jobStore.getJob(jobId);
    
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    if (job.userId !== userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    if (job.status !== 'completed') {
      throw new HttpException(
        `Job is ${job.status}. Wait for completion.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!job.result) {
      throw new HttpException('Export result not available', HttpStatus.NOT_FOUND);
    }

    const buffer = job.result.isBase64 
      ? Buffer.from(job.result.data, 'base64')
      : Buffer.from(job.result.data);
    
    res.set({
      'Content-Type': job.result.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${job.result.filename}"`,
    });
    
    res.send(buffer);

    // Cleanup after download
    setTimeout(() => {
      this.jobStore.deleteJob(jobId);
    }, 5000);
  }

  @Post('schema')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get database schema metadata' })
  async getSchema(@Req() req: Request) {
    const token = req.headers.authorization;
    
    if (!token) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.kafkaService.sendRequest(
      'export.request',
      'export.response',
      { type: 'schema', token },
      30000,
    );

    if (!result.success) {
      throw new HttpException(result.error || 'Failed to get schema', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      success: true,
      tables: result.schema,
    };
  }
}
