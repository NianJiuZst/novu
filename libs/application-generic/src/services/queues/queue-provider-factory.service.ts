import { Injectable, Logger } from '@nestjs/common';
import { FeatureFlagsKeysEnum, JobTopicNameEnum } from '@novu/shared';

import { FeatureFlagsService } from '../feature-flags';
import { WorkflowInMemoryProviderService } from '../in-memory-provider';
import { BullMqQueueProvider } from './providers/bullmq/bullmq-queue-provider.service';
import { IQueueProvider } from './providers/queue-provider.interface';
import { createSqsConfig } from './providers/sqs/sqs-config.interface';
import { SqsQueueProvider } from './providers/sqs/sqs-queue-provider.service';

const LOG_CONTEXT = 'QueueProviderFactory';

@Injectable()
export class QueueProviderFactory {
  private sqsProvider?: SqsQueueProvider;
  private bullMqProvider?: BullMqQueueProvider;

  constructor(
    private featureFlagsService: FeatureFlagsService,
    private workflowInMemoryProviderService: WorkflowInMemoryProviderService
  ) {}

  async createProvider(topic: JobTopicNameEnum): Promise<IQueueProvider> {
    const queueProvider = process.env.QUEUE_PROVIDER || 'bullmq';
    const isSqsEnabled = await this.featureFlagsService.getFlag({
      key: FeatureFlagsKeysEnum.IS_SQS_QUEUE_ENABLED,
      defaultValue: false,
      organization: { _id: '' },
      environment: { _id: '' },
      user: { _id: '' },
    });

    console.log('queueProvider', queueProvider);
    console.log('isSqsEnabled', isSqsEnabled);
    console.log('this.isSqsConfigured()', this.isSqsConfigured());
    console.log('this.isCommunityEdition()', this.isCommunityEdition());
    console.log('queueProvider === "sqs"', queueProvider === 'sqs');
    console.log('isSqsEnabled && this.isSqsConfigured()', isSqsEnabled && this.isSqsConfigured());

    // For community edition, always use BullMQ
    if (this.isCommunityEdition()) {
      Logger.log(`Community edition detected, using BullMQ for ${topic}`, LOG_CONTEXT);

      return this.getBullMqProvider();
    }

    // Use SQS only if explicitly enabled and configured
    if (queueProvider === 'sqs' && isSqsEnabled && this.isSqsConfigured()) {
      Logger.log(`Using SQS provider for ${topic}`, LOG_CONTEXT);

      return this.getSqsProvider();
    }

    Logger.log(`Using BullMQ provider for ${topic}`, LOG_CONTEXT);

    return this.getBullMqProvider();
  }

  async createSecondaryProvider(
    topic: JobTopicNameEnum,
    primaryProvider: IQueueProvider
  ): Promise<IQueueProvider | undefined> {
    const enableDual = process.env.ENABLE_DUAL_QUEUE_PROCESSING === 'true';

    if (!enableDual) {
      return undefined;
    }

    // In dual mode, secondary is the opposite of primary
    if (primaryProvider instanceof SqsQueueProvider) {
      Logger.log(`Creating secondary BullMQ provider for ${topic}`, LOG_CONTEXT);

      return this.getBullMqProvider();
    } else {
      if (this.isSqsConfigured()) {
        Logger.log(`Creating secondary SQS provider for ${topic}`, LOG_CONTEXT);

        return this.getSqsProvider();
      }
    }

    return undefined;
  }

  private getSqsProvider(): SqsQueueProvider {
    if (!this.sqsProvider) {
      const config = createSqsConfig();
      this.sqsProvider = new SqsQueueProvider(config);
      Logger.log('Created SQS provider instance', LOG_CONTEXT);
    }

    return this.sqsProvider;
  }

  private getBullMqProvider(): BullMqQueueProvider {
    if (!this.bullMqProvider) {
      this.bullMqProvider = new BullMqQueueProvider(this.workflowInMemoryProviderService);
      Logger.log('Created BullMQ provider instance', LOG_CONTEXT);
    }

    return this.bullMqProvider;
  }

  private isCommunityEdition(): boolean {
    return !process.env.NOVU_ENTERPRISE || process.env.NOVU_ENTERPRISE === 'false';
  }

  private isSqsConfigured(): boolean {
    const requiredVars = ['AWS_SQS_QUEUE_URL_PREFIX'];

    const hasRequired = requiredVars.every((varName) => {
      const value = process.env[varName];

      return value && value.trim() !== '';
    });

    if (!hasRequired) {
      Logger.warn('SQS configuration incomplete. Missing required environment variables', LOG_CONTEXT);
    }

    return hasRequired;
  }

  async gracefulShutdown(): Promise<void> {
    Logger.log('Starting queue provider factory shutdown', LOG_CONTEXT);

    const shutdownPromises: Promise<void>[] = [];

    // Shutdown SQS provider
    if (this.sqsProvider) {
      shutdownPromises.push(
        this.sqsProvider
          .gracefulShutdown()
          .then(() => Logger.log('SQS provider shut down', LOG_CONTEXT))
          .catch((error) => Logger.error(`Error shutting down SQS provider: ${error.message}`, LOG_CONTEXT))
      );
    }

    // Shutdown BullMQ provider
    if (this.bullMqProvider) {
      shutdownPromises.push(
        this.bullMqProvider
          .gracefulShutdown()
          .then(() => Logger.log('BullMQ provider shut down', LOG_CONTEXT))
          .catch((error) => Logger.error(`Error shutting down BullMQ provider: ${error.message}`, LOG_CONTEXT))
      );
    }

    await Promise.all(shutdownPromises);

    // Clear references
    this.sqsProvider = undefined;
    this.bullMqProvider = undefined;

    Logger.log('Queue provider factory shutdown completed', LOG_CONTEXT);
  }
}
