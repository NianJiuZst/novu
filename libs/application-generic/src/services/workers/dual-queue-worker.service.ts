import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { JobTopicNameEnum } from '@novu/shared';
import { WorkflowInMemoryProviderService } from '../in-memory-provider';
import { BullMqQueueProvider } from '../queues/providers/bullmq/bullmq-queue-provider.service';
import { IQueueProvider, QueueProcessor } from '../queues/providers/queue-provider.interface';
import { SqsQueueProvider } from '../queues/providers/sqs/sqs-queue-provider.service';
import { QueueProviderFactory } from '../queues/queue-provider-factory.service';

const LOG_CONTEXT = 'DualQueueWorkerService';

@Injectable()
export class DualQueueWorkerService implements OnApplicationShutdown {
  private primaryProvider?: IQueueProvider;
  private secondaryProvider?: IQueueProvider;
  private isDualMode = false;
  private isInitialized = false;

  constructor(
    private queueProviderFactory: QueueProviderFactory,
    private workflowInMemoryProviderService: WorkflowInMemoryProviderService
  ) {
    this.isDualMode = process.env.ENABLE_DUAL_QUEUE_PROCESSING === 'true';
  }

  async initialize(topic: JobTopicNameEnum, processor: QueueProcessor): Promise<void> {
    if (this.isInitialized) {
      Logger.warn(`Worker for ${topic} is already initialized`, LOG_CONTEXT);
      return;
    }

    const queueProvider = process.env.QUEUE_PROVIDER || 'bullmq';

    Logger.log(`Initializing worker for ${topic}. Provider: ${queueProvider}, Dual: ${this.isDualMode}`, LOG_CONTEXT);

    try {
      if (this.isDualMode) {
        // In dual mode, start both workers
        await this.initializeBothWorkers(topic, processor);
        Logger.log(`Dual queue processing enabled for topic: ${topic}`, LOG_CONTEXT);
      } else {
        // Single mode - use factory to determine provider
        await this.initializeSingleWorker(topic, processor);
      }

      this.isInitialized = true;
      Logger.log(`Worker initialization completed for topic: ${topic}`, LOG_CONTEXT);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`Failed to initialize worker for ${topic}: ${errorMessage}`, LOG_CONTEXT);

      // Fallback to BullMQ for backward compatibility
      await this.initializeBullMqFallback(topic, processor);
      this.isInitialized = true;
    }
  }

  private async initializeBothWorkers(topic: JobTopicNameEnum, processor: QueueProcessor): Promise<void> {
    // Get both providers
    this.primaryProvider = await this.queueProviderFactory.createProvider(topic);
    this.secondaryProvider = await this.queueProviderFactory.createSecondaryProvider(topic, this.primaryProvider);

    // Start primary worker
    this.primaryProvider.createWorker(topic, processor);
    Logger.log(`Primary worker started for ${topic}`, LOG_CONTEXT);

    // Start secondary worker if available
    if (this.secondaryProvider) {
      this.secondaryProvider.createWorker(topic, processor);
      Logger.log(`Secondary worker started for ${topic}`, LOG_CONTEXT);
    }
  }

  private async initializeSingleWorker(topic: JobTopicNameEnum, processor: QueueProcessor): Promise<void> {
    this.primaryProvider = await this.queueProviderFactory.createProvider(topic);
    this.primaryProvider.createWorker(topic, processor);

    const providerType = this.primaryProvider instanceof SqsQueueProvider ? 'SQS' : 'BullMQ';
    Logger.log(`Single ${providerType} worker started for ${topic}`, LOG_CONTEXT);
  }

  private async initializeBullMqFallback(topic: JobTopicNameEnum, processor: QueueProcessor): Promise<void> {
    Logger.log(`Falling back to BullMQ worker for ${topic}`, LOG_CONTEXT);

    this.primaryProvider = new BullMqQueueProvider(this.workflowInMemoryProviderService);
    this.primaryProvider.createWorker(topic, processor);
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    Logger.log(`Starting worker shutdown (signal: ${signal})`, LOG_CONTEXT);

    const shutdownPromises: Promise<void>[] = [];

    if (this.primaryProvider) {
      shutdownPromises.push(
        this.primaryProvider
          .gracefulShutdown()
          .then(() => Logger.log('Primary worker shut down', LOG_CONTEXT))
          .catch((error) => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            Logger.error(`Error shutting down primary worker: ${errorMessage}`, LOG_CONTEXT);
          })
      );
    }

    if (this.secondaryProvider) {
      shutdownPromises.push(
        this.secondaryProvider
          .gracefulShutdown()
          .then(() => Logger.log('Secondary worker shut down', LOG_CONTEXT))
          .catch((error) => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            Logger.error(`Error shutting down secondary worker: ${errorMessage}`, LOG_CONTEXT);
          })
      );
    }

    await Promise.all(shutdownPromises);

    // Clear references
    this.primaryProvider = undefined;
    this.secondaryProvider = undefined;
    this.isInitialized = false;

    Logger.log('Worker shutdown completed', LOG_CONTEXT);
  }

  /**
   * Pause all active workers
   */
  public async pause(): Promise<void> {
    if (this.primaryProvider && typeof this.primaryProvider.pause === 'function') {
      await this.primaryProvider.pause();
      Logger.log('Primary worker paused', LOG_CONTEXT);
    }

    if (this.secondaryProvider && typeof this.secondaryProvider.pause === 'function') {
      await this.secondaryProvider.pause();
      Logger.log('Secondary worker paused', LOG_CONTEXT);
    }
  }

  /**
   * Resume all active workers
   */
  public async resume(): Promise<void> {
    if (this.primaryProvider && typeof this.primaryProvider.resume === 'function') {
      await this.primaryProvider.resume();
      Logger.log('Primary worker resumed', LOG_CONTEXT);
    }

    if (this.secondaryProvider && typeof this.secondaryProvider.resume === 'function') {
      await this.secondaryProvider.resume();
      Logger.log('Secondary worker resumed', LOG_CONTEXT);
    }
  }

  public getStatus(): {
    isInitialized: boolean;
    isDualMode: boolean;
    primaryProvider: string;
    secondaryProvider?: string;
  } {
    return {
      isInitialized: this.isInitialized,
      isDualMode: this.isDualMode,
      primaryProvider: this.primaryProvider
        ? this.primaryProvider instanceof SqsQueueProvider
          ? 'SQS'
          : 'BullMQ'
        : 'None',
      secondaryProvider: this.secondaryProvider
        ? this.secondaryProvider instanceof SqsQueueProvider
          ? 'SQS'
          : 'BullMQ'
        : undefined,
    };
  }
}
