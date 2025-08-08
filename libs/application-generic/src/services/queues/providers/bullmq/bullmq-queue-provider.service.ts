import { Injectable, Logger } from '@nestjs/common';
import { JobTopicNameEnum } from '@novu/shared';

import { BullMqService, Processor } from '../../../bull-mq';
import { WorkflowInMemoryProviderService } from '../../../in-memory-provider';
import { IBulkJobParams, IJobParams, IQueueProvider, QueueProcessor } from '../queue-provider.interface';

const LOG_CONTEXT = 'BullMqQueueProvider';

@Injectable()
export class BullMqQueueProvider implements IQueueProvider {
  private bullMqServices: Map<JobTopicNameEnum, BullMqService> = new Map();

  constructor(private workflowInMemoryProviderService: WorkflowInMemoryProviderService) {}

  private getBullMqService(topic: JobTopicNameEnum): BullMqService {
    if (!this.bullMqServices.has(topic)) {
      const service = new BullMqService(this.workflowInMemoryProviderService);
      this.bullMqServices.set(topic, service);
      Logger.log(`Created BullMQ service for topic ${topic}`, LOG_CONTEXT);
    }

    const service = this.bullMqServices.get(topic);
    if (!service) {
      throw new Error(`BullMQ service not found for topic: ${topic}`);
    }

    return service;
  }

  async add(params: IJobParams): Promise<void> {
    const service = this.getBullMqService(params.topic);

    // Ensure queue is created
    if (!service.queue) {
      service.createQueue(params.topic, {});
    }

    const jobOptions = {
      removeOnComplete: true,
      removeOnFail: true,
      ...params.options,
    };

    try {
      await service.add(params.name, params.data as any, jobOptions, params.groupId);
      Logger.verbose(`Job ${params.name} added to BullMQ queue ${params.topic}`, LOG_CONTEXT);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      Logger.error(`Failed to add job ${params.name} to BullMQ: ${errorMessage}`, errorStack, LOG_CONTEXT);
      throw error;
    }
  }

  async addBulk(data: IBulkJobParams[]): Promise<void> {
    if (data.length === 0) {
      return;
    }

    // Group jobs by topic
    const jobsByTopic = this.groupByTopic(data);

    for (const [topic, jobs] of jobsByTopic.entries()) {
      const service = this.getBullMqService(topic);

      // Ensure queue is created
      if (!service.queue) {
        service.createQueue(topic, {});
      }

      const bullMqJobs = jobs.map((job) => ({
        name: job.name,
        data: job.data as any,
        options: {
          removeOnComplete: true,
          removeOnFail: true,
          ...job.options,
        },
        groupId: job.groupId,
      }));

      try {
        await service.addBulk(bullMqJobs);
        Logger.verbose(`Bulk added ${jobs.length} jobs to BullMQ topic ${topic}`, LOG_CONTEXT);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        Logger.error(`Failed to bulk add jobs to BullMQ topic ${topic}: ${errorMessage}`, errorStack, LOG_CONTEXT);
        throw error;
      }
    }
  }

  createWorker(topic: JobTopicNameEnum, processor: QueueProcessor): void {
    const service = this.getBullMqService(topic);

    // Ensure queue is created first
    if (!service.queue) {
      service.createQueue(topic, {});
    }

    // Create BullMQ processor wrapper
    const bullMqProcessor: Processor = async (job) => {
      const startTime = Date.now();

      try {
        Logger.verbose(`Processing BullMQ job ${job.id} from topic ${topic}`, LOG_CONTEXT);
        await processor(job.data);

        const duration = Date.now() - startTime;
        Logger.verbose(`Completed BullMQ job ${job.id} in ${duration}ms`, LOG_CONTEXT);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        Logger.error(`Failed to process BullMQ job ${job.id}: ${errorMessage}`, errorStack, LOG_CONTEXT);
        throw error;
      }
    };

    // Create worker with default options
    const workerOptions = {
      concurrency: parseInt(process.env.WORKER_DEFAULT_CONCURRENCY || '1'),
      lockDuration: parseInt(process.env.WORKER_DEFAULT_LOCK_DURATION || '30000'),
    };

    service.createWorker(topic, bullMqProcessor, workerOptions);
    Logger.log(`BullMQ worker created for topic ${topic}`, LOG_CONTEXT);
  }

  async gracefulShutdown(): Promise<void> {
    Logger.log('Starting BullMQ graceful shutdown...', LOG_CONTEXT);

    const shutdownPromises = Array.from(this.bullMqServices.entries()).map(async ([topic, service]) => {
      try {
        await service.gracefulShutdown();
        Logger.log(`Shut down BullMQ service for topic: ${topic}`, LOG_CONTEXT);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        Logger.error(`Error shutting down BullMQ service for ${topic}: ${errorMessage}`, errorStack, LOG_CONTEXT);
      }
    });

    await Promise.all(shutdownPromises);
    this.bullMqServices.clear();

    Logger.log('BullMQ graceful shutdown completed', LOG_CONTEXT);
  }

  private groupByTopic(jobs: IBulkJobParams[]): Map<JobTopicNameEnum, IBulkJobParams[]> {
    const grouped = new Map<JobTopicNameEnum, IBulkJobParams[]>();

    for (const job of jobs) {
      if (!grouped.has(job.topic)) {
        grouped.set(job.topic, []);
      }
      const topicJobs = grouped.get(job.topic);
      if (topicJobs) {
        topicJobs.push(job);
      }
    }

    return grouped;
  }

  public getBullMqServiceForTopic(topic: JobTopicNameEnum): BullMqService {
    return this.getBullMqService(topic);
  }

  /**
   * Pause all BullMQ workers
   */
  async pause(): Promise<void> {
    const pausePromises = Array.from(this.bullMqServices.entries()).map(async ([topic, bullMqService]) => {
      try {
        await bullMqService.pauseWorker();
        Logger.log(`BullMQ worker paused for topic: ${topic}`, LOG_CONTEXT);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.error(`Failed to pause BullMQ worker for ${topic}: ${errorMessage}`, LOG_CONTEXT);
      }
    });

    await Promise.all(pausePromises);
    Logger.log('All BullMQ workers paused', LOG_CONTEXT);
  }

  /**
   * Resume all BullMQ workers
   */
  async resume(): Promise<void> {
    const resumePromises = Array.from(this.bullMqServices.entries()).map(async ([topic, bullMqService]) => {
      try {
        await bullMqService.resumeWorker();
        Logger.log(`BullMQ worker resumed for topic: ${topic}`, LOG_CONTEXT);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.error(`Failed to resume BullMQ worker for ${topic}: ${errorMessage}`, LOG_CONTEXT);
      }
    });

    await Promise.all(resumePromises);
    Logger.log('All BullMQ workers resumed', LOG_CONTEXT);
  }
}
