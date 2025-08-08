import { Logger } from '@nestjs/common';
import { IJobData, JobTopicNameEnum } from '@novu/shared';

import { BulkJobOptions, BullMqService, JobsOptions, Queue, QueueOptions } from '../bull-mq';
import { BullMqQueueProvider } from './providers/bullmq/bullmq-queue-provider.service';
import {
  IBulkJobParams as IProviderBulkJobParams,
  IJobParams as IProviderJobParams,
  IQueueProvider,
} from './providers/queue-provider.interface';
import { SqsDelayLimitExceededException, SqsQueueProvider } from './providers/sqs/sqs-queue-provider.service';
import { QueueProviderFactory } from './queue-provider-factory.service';

const LOG_CONTEXT = 'QueueService';

export class QueueBaseService {
  private instance: BullMqService; // Kept for backward compatibility
  private primaryProvider?: IQueueProvider;
  private secondaryProvider?: IQueueProvider;
  private isDualMode = false;
  private isInitialized = false;

  public readonly DEFAULT_ATTEMPTS = 3;
  public queue: Queue;

  constructor(
    public readonly topic: JobTopicNameEnum,
    private bullMqService: BullMqService,
    private providerFactory?: QueueProviderFactory
  ) {
    this.instance = bullMqService;
    this.isDualMode = process.env.ENABLE_DUAL_QUEUE_PROCESSING === 'true';
  }

  public createQueue(overrideOptions?: QueueOptions): void {
    const options = {
      ...this.getQueueOptions(),
      ...(overrideOptions && {
        defaultJobOptions: {
          ...this.getQueueOptions().defaultJobOptions,
          ...overrideOptions.defaultJobOptions,
        },
      }),
    };

    this.queue = this.instance.createQueue(this.topic, options);
  }

  private async initializeProviders(): Promise<void> {
    console.log('initializeProviders');
    console.log('this.isInitialized', this.isInitialized);
    console.log('this.providerFactory', this.providerFactory);
    if (this.isInitialized || !this.providerFactory) {
      return;
    }

    try {
      this.primaryProvider = await this.providerFactory.createProvider(this.topic);

      if (this.isDualMode) {
        this.secondaryProvider = await this.providerFactory.createSecondaryProvider(this.topic, this.primaryProvider);
        Logger.log(`Dual queue mode enabled for topic ${this.topic}`, LOG_CONTEXT);
      }

      this.isInitialized = true;
      Logger.log(`Queue providers initialized for topic ${this.topic}`, LOG_CONTEXT);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      Logger.error(`Failed to initialize queue providers for ${this.topic}: ${errorMessage}`, errorStack, LOG_CONTEXT);
      // Fallback to legacy BullMQ
      this.primaryProvider = undefined;
      this.isInitialized = true;
    }
  }

  private getQueueOptions(): QueueOptions {
    return {
      defaultJobOptions: {
        removeOnComplete: true,
      },
    };
  }

  public isReady(): boolean {
    return this.instance.isClientReady();
  }

  public async isPaused(): Promise<boolean> {
    return await this.instance.isQueuePaused();
  }

  public async getStatus() {
    return await this.instance.getStatus();
  }

  public async getGroupsJobsCount() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (this.instance.queue as any).getGroupsJobsCount();
  }

  public async getWaitingCount() {
    return await this.instance.queue.getWaitingCount();
  }

  public async getDelayedCount() {
    return await this.instance.queue.getDelayedCount();
  }

  public async getActiveCount() {
    return await this.instance.queue.getActiveCount();
  }

  public async gracefulShutdown(): Promise<void> {
    Logger.log(`Shutting the ${this.topic} queue service down`, LOG_CONTEXT);

    this.queue = undefined;
    await this.instance.gracefulShutdown();

    Logger.log(`Shutting down the ${this.topic} queue service has finished`, LOG_CONTEXT);
  }

  public async add(params: IJobParams) {
    // Initialize providers if using new system
    await this.initializeProviders();

    if (this.primaryProvider) {
      return this.addWithNewSystem(params);
    }

    // Fallback to legacy system
    const jobOptions = {
      removeOnComplete: true,
      removeOnFail: true,
      ...params.options,
    };

    await this.instance.add(params.name, params.data as any, jobOptions, params.groupId);
  }

  private async addWithNewSystem(params: IJobParams): Promise<void> {
    const providerParams: IProviderJobParams = {
      name: params.name,
      data: params.data,
      topic: this.topic,
      groupId: params.groupId,
      options: params.options
        ? {
            delay: params.options.delay,
            attempts: params.options.attempts,
            backoff: params.options.backoff,
            removeOnComplete:
              typeof params.options.removeOnComplete === 'boolean' ? params.options.removeOnComplete : true,
            removeOnFail: typeof params.options.removeOnFail === 'boolean' ? params.options.removeOnFail : true,
          }
        : undefined,
    };

    const hasDelay = params.options?.delay && params.options.delay > 0;
    const exceedsSqsLimit = hasDelay && params.options.delay > 900000; // 15 minutes

    try {
      // Route delayed jobs > 15 minutes to BullMQ if primary provider is SQS
      if (exceedsSqsLimit && this.primaryProvider instanceof SqsQueueProvider) {
        Logger.log(`Job ${params.name} has delay ${params.options.delay}ms (> 15 min), routing to BullMQ`, LOG_CONTEXT);
        await this.getBullMqProvider().add(providerParams);

        return;
      }

      // Primary queue write
      await this.primaryProvider.add(providerParams);
      Logger.verbose(`Job ${params.name} added to primary queue`, LOG_CONTEXT);

      // Dual mode: write to secondary queue as well
      if (this.isDualMode && this.secondaryProvider) {
        try {
          await this.secondaryProvider.add(providerParams);
          Logger.verbose(`Job ${params.name} added to secondary queue`, LOG_CONTEXT);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          Logger.error(
            `Failed to write job ${params.name} to secondary queue: ${errorMessage}`,
            errorStack,
            LOG_CONTEXT
          );
          // Don't fail the operation if secondary write fails
        }
      }
    } catch (error) {
      if (error instanceof SqsDelayLimitExceededException) {
        // Fallback to BullMQ for delayed jobs
        Logger.log(`Falling back to BullMQ for delayed job ${params.name}`, LOG_CONTEXT);
        await this.getBullMqProvider().add(providerParams);
      } else {
        throw error;
      }
    }
  }

  private getBullMqProvider(): IQueueProvider {
    if (this.primaryProvider instanceof BullMqQueueProvider) {
      return this.primaryProvider;
    }
    if (this.secondaryProvider instanceof BullMqQueueProvider) {
      return this.secondaryProvider;
    }
    // Create a new BullMQ instance if needed for fallback
    // Fallback to using the legacy instance
    return {
      add: async (params: IProviderJobParams) => {
        const jobOptions = {
          removeOnComplete: true,
          removeOnFail: true,
          ...params.options,
        };
        await this.instance.add(params.name, params.data as any, jobOptions as any, params.groupId);
      },
      addBulk: async (data: IProviderBulkJobParams[]) => {
        const bullMqData = data.map((job) => ({
          name: job.name,
          data: job.data as any,
          options: job.options as any,
          groupId: job.groupId,
        }));
        await this.instance.addBulk(bullMqData);
      },
      gracefulShutdown: async () => {
        await this.instance.gracefulShutdown();
      },
      createWorker: () => {
        // Worker creation handled elsewhere for legacy compatibility
      },
    };
  }

  public async addBulk(data: IBulkJobParams[]) {
    // Initialize providers if using new system
    await this.initializeProviders();

    if (this.primaryProvider) {
      return this.addBulkWithNewSystem(data);
    }

    // Fallback to legacy system
    const bullMqData = data.map((job) => ({
      name: job.name,
      data: job.data as any,
      options: job.options as any,
      groupId: job.groupId,
    }));
    await this.instance.addBulk(bullMqData);
  }

  private async addBulkWithNewSystem(data: IBulkJobParams[]): Promise<void> {
    if (data.length === 0) {
      return;
    }

    // Convert to provider format and separate jobs that need BullMQ routing (delayed > 15 min)
    const bullMqJobs: IProviderBulkJobParams[] = [];
    const regularJobs: IProviderBulkJobParams[] = [];

    for (const job of data) {
      const providerJob: IProviderBulkJobParams = {
        name: job.name,
        data: job.data,
        topic: this.topic,
        groupId: job.groupId,
        options: job.options
          ? {
              delay: job.options.delay,
              attempts: job.options.attempts,
              backoff: job.options.backoff,
              removeOnComplete: typeof job.options.removeOnComplete === 'boolean' ? job.options.removeOnComplete : true,
              removeOnFail: typeof job.options.removeOnFail === 'boolean' ? job.options.removeOnFail : true,
            }
          : undefined,
      };

      const hasLongDelay = job.options?.delay && job.options.delay > 900000;

      if (hasLongDelay && this.primaryProvider instanceof SqsQueueProvider) {
        bullMqJobs.push(providerJob);
      } else {
        regularJobs.push(providerJob);
      }
    }

    // Process regular jobs
    if (regularJobs.length > 0) {
      await this.primaryProvider.addBulk(regularJobs);

      if (this.isDualMode && this.secondaryProvider) {
        try {
          await this.secondaryProvider.addBulk(regularJobs);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          Logger.error(`Failed to write bulk jobs to secondary queue: ${errorMessage}`, errorStack, LOG_CONTEXT);
        }
      }
    }

    // Process BullMQ-routed jobs
    if (bullMqJobs.length > 0) {
      Logger.log(`Routing ${bullMqJobs.length} delayed jobs to BullMQ`, LOG_CONTEXT);
      await this.getBullMqProvider().addBulk(bullMqJobs);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.gracefulShutdown();
  }
}

export interface IJobParams {
  name: string;
  data?: unknown;
  groupId?: string;
  options?: JobsOptions;
}

export interface IBulkJobParams {
  name: string;
  data: unknown;
  groupId?: string;
  options?: BulkJobOptions;
}
