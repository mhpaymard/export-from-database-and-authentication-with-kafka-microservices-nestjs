import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface ExportJob {
  jobId: string;
  userId: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: {
    data: string;
    isBase64: boolean;
    contentType: string;
    filename: string;
    format: string;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

@Injectable()
export class JobStoreService {
  private readonly logger = new Logger(JobStoreService.name);
  private readonly jobs = new Map<string, ExportJob>();
  private readonly jobEvents = new Map<string, EventEmitter>();
  private readonly TTL = 3600000; // 1 hour in milliseconds

  constructor() {
    // Cleanup expired jobs every 5 minutes
    setInterval(() => this.cleanupExpiredJobs(), 300000);
  }

  createJob(jobId: string, userId: number): ExportJob {
    const job: ExportJob = {
      jobId,
      userId,
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.TTL),
    };

    this.jobs.set(jobId, job);
    this.jobEvents.set(jobId, new EventEmitter());
    
    this.logger.log(`Created job ${jobId} for user ${userId}`);
    return job;
  }

  getJob(jobId: string): ExportJob | undefined {
    return this.jobs.get(jobId);
  }

  updateJob(jobId: string, updates: Partial<ExportJob>): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      this.logger.warn(`Job ${jobId} not found for update`);
      return;
    }

    Object.assign(job, updates);
    
    // Emit event for SSE listeners
    const emitter = this.jobEvents.get(jobId);
    if (emitter) {
      emitter.emit('update', job);
    }

    this.logger.debug(`Updated job ${jobId}: ${JSON.stringify(updates)}`);
  }

  completeJob(jobId: string, result: ExportJob['result']): void {
    this.updateJob(jobId, {
      status: 'completed',
      progress: 100,
      result,
      completedAt: new Date(),
    });
  }

  failJob(jobId: string, error: string): void {
    this.updateJob(jobId, {
      status: 'failed',
      error,
      completedAt: new Date(),
    });
  }

  updateProgress(jobId: string, progress: number, message?: string): void {
    this.updateJob(jobId, {
      status: 'processing',
      progress,
      message,
    });
  }

  getJobEmitter(jobId: string): EventEmitter | undefined {
    return this.jobEvents.get(jobId);
  }

  deleteJob(jobId: string): void {
    const emitter = this.jobEvents.get(jobId);
    if (emitter) {
      emitter.removeAllListeners();
      this.jobEvents.delete(jobId);
    }
    this.jobs.delete(jobId);
    this.logger.log(`Deleted job ${jobId}`);
  }

  private cleanupExpiredJobs(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.expiresAt.getTime() < now) {
        this.deleteJob(jobId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired jobs`);
    }
  }

  getUserJobs(userId: number): ExportJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
