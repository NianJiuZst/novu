import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { JobTopicNameEnum } from '@novu/shared';

import { BullMqService } from '../bull-mq';
import { FeatureFlagsService } from '../feature-flags';
import { WorkflowInMemoryProviderService } from '../in-memory-provider';
import { QueueProcessor } from '../queues/providers/queue-provider.interface';
import { QueueProviderFactory } from '../queues/queue-provider-factory.service';
import { INovuWorker } from '../readiness';
import { DualQueueWorkerService } from './dual-queue-worker.service';

const LOG_CONTEXT = 'EnhancedWorkerBaseService';

/**
 * Enhanced worker base service that supports both BullMQ and SQS queue processing
 *
 * This service can operate in three modes:
 * 1. Legacy mode: Only BullMQ (backward compatible)
 * 2. Single queue mode: Either BullMQ or SQS based on configuration
 * 3. Dual queue mode: Both BullMQ and SQS for migration scenarios
 */
export class EnhancedWorkerBaseService implements INovuWorker, OnApplicationShutdown {
  protected dualQueueWorker?: DualQueueWorkerService;
  protected isEnhancedMode = false;
  protected isInitialized = false;

  // Backward compatibility properties
  public readonly DEFAULT_ATTEMPTS = 3;

  constructor(
    protected readonly topic: JobTopicNameEnum,
    protected bullMqService: BullMqService,
    protected queueProviderFactory?: QueueProviderFactory,
    protected workflowInMemoryProviderService?: WorkflowInMemoryProviderService
  ) {
    // Enhanced mode is enabled if we have the factory
    this.isEnhancedMode = !!queueProviderFactory;

    if (this.isEnhancedMode) {
      this.dualQueueWorker = new DualQueueWorkerService(queueProviderFactory!, workflowInMemoryProviderService!);
      Logger.log(`Enhanced worker mode enabled for ${topic}`, LOG_CONTEXT);
    } else {
      Logger.log(`Legacy worker mode for ${topic}`, LOG_CONTEXT);
    }
  }

  // Backward compatibility getter for BullMQ worker
  public get worker() {
    return this.bullMqService?.worker;
  }

  /**
   * Initialize the worker with a processor function
   *
   * In enhanced mode, this will create workers for the configured queue providers
   * In legacy mode, this falls back to the traditional BullMQ worker
   */
  protected async initWorker(processor: QueueProcessor, workerOptions?: any): Promise<void> {
    if (this.isInitialized) {
      Logger.warn(`Worker for ${this.topic} is already initialized`, LOG_CONTEXT);
      return;
    }

    try {
      if (this.isEnhancedMode && this.dualQueueWorker) {
        // Use the enhanced dual queue worker
        await this.dualQueueWorker.initialize(this.topic, processor);
        Logger.log(`Enhanced worker initialized for ${this.topic}`, LOG_CONTEXT);
      } else {
        // Fallback to legacy BullMQ worker initialization
        await this.initLegacyWorker(processor, workerOptions);
        Logger.log(`Legacy worker initialized for ${this.topic}`, LOG_CONTEXT);
      }

      this.isInitialized = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`Failed to initialize worker for ${this.topic}: ${errorMessage}`, LOG_CONTEXT);

      // Always fallback to legacy mode on error
      if (this.isEnhancedMode) {
        Logger.log(`Falling back to legacy worker for ${this.topic}`, LOG_CONTEXT);
        await this.initLegacyWorker(processor, workerOptions);
        this.isInitialized = true;
      } else {
        throw error;
      }
    }
  }

  /**
   * Initialize legacy BullMQ worker (backward compatibility)
   */
  private async initLegacyWorker(processor: QueueProcessor, workerOptions?: any): Promise<void> {
    Logger.log(`Legacy BullMQ worker initialization for ${this.topic}`, LOG_CONTEXT);

    // Create the actual BullMQ worker using the BullMQ service
    if (this.bullMqService && this.bullMqService.createWorker) {
      this.bullMqService.createWorker(this.topic, processor, workerOptions);
      Logger.log(`BullMQ worker created for ${this.topic}`, LOG_CONTEXT);
    } else {
      Logger.error(`BullMQ service not available for ${this.topic}`, LOG_CONTEXT);
    }
  }

  /**
   * Get the status of the worker
   */
  public getWorkerStatus(): {
    topic: JobTopicNameEnum;
    isEnhanced: boolean;
    isInitialized: boolean;
    dualQueueStatus?: any;
  } {
    return {
      topic: this.topic,
      isEnhanced: this.isEnhancedMode,
      isInitialized: this.isInitialized,
      dualQueueStatus: this.dualQueueWorker?.getStatus(),
    };
  }

  /**
   * Graceful shutdown for both enhanced and legacy modes
   */
  async onApplicationShutdown(signal?: string): Promise<void> {
    Logger.log(`Starting worker shutdown for ${this.topic} (signal: ${signal})`, LOG_CONTEXT);

    try {
      if (this.isEnhancedMode && this.dualQueueWorker) {
        await this.dualQueueWorker.onApplicationShutdown(signal);
      } else {
        // Legacy shutdown would be handled by subclasses
        Logger.log(`Legacy worker shutdown for ${this.topic}`, LOG_CONTEXT);
      }

      Logger.log(`Worker shutdown completed for ${this.topic}`, LOG_CONTEXT);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`Error during worker shutdown for ${this.topic}: ${errorMessage}`, LOG_CONTEXT);
    }
  }

  /**
   * Check if the worker is using enhanced mode
   */
  public isUsingEnhancedMode(): boolean {
    return this.isEnhancedMode;
  }

  /**
   * Check if dual queue processing is enabled
   */
  public isDualQueueMode(): boolean {
    return this.isEnhancedMode && process.env.ENABLE_DUAL_QUEUE_PROCESSING === 'true';
  }

  /**
   * Pause the worker (implements INovuWorker interface)
   */
  public async pause(): Promise<void> {
    try {
      if (this.isEnhancedMode && this.dualQueueWorker) {
        // For enhanced mode, pause both workers if available
        await this.dualQueueWorker.pause();
      } else if (this.bullMqService) {
        // For legacy mode, pause the BullMQ worker
        await this.bullMqService.pauseWorker();
      }
      Logger.log(`Worker ${this.topic} paused successfully`, LOG_CONTEXT);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`Failed to pause worker ${this.topic}: ${errorMessage}`, LOG_CONTEXT);
      throw error;
    }
  }

  /**
   * Resume the worker (implements INovuWorker interface)
   */
  public async resume(): Promise<void> {
    try {
      if (this.isEnhancedMode && this.dualQueueWorker) {
        // For enhanced mode, resume both workers if available
        await this.dualQueueWorker.resume();
      } else if (this.bullMqService) {
        // For legacy mode, resume the BullMQ worker
        await this.bullMqService.resumeWorker();
      }
      Logger.log(`Worker ${this.topic} resumed successfully`, LOG_CONTEXT);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`Failed to resume worker ${this.topic}: ${errorMessage}`, LOG_CONTEXT);
      throw error;
    }
  }

  /**
   * Graceful shutdown (implements INovuWorker interface)
   */
  public async gracefulShutdown(): Promise<void> {
    await this.onApplicationShutdown();
  }

  /**
   * Module destroy lifecycle hook (implements INovuWorker interface)
   */
  public async onModuleDestroy(): Promise<void> {
    await this.gracefulShutdown();
  }
}
