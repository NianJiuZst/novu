import { Injectable, Logger } from '@nestjs/common';
import { JobTopicNameEnum } from '@novu/shared';

import { BullMqService } from '../bull-mq';
import { FeatureFlagsService } from '../feature-flags';
import { WorkflowInMemoryProviderService } from '../in-memory-provider';
import { QueueProcessor } from '../queues/providers/queue-provider.interface';
import { QueueProviderFactory } from '../queues/queue-provider-factory.service';
import { EnhancedWorkerBaseService } from './enhanced-worker-base.service';

const LOG_CONTEXT = 'EnhancedStandardWorkerService';

/**
 * Enhanced Standard Worker Service that supports both BullMQ and SQS
 *
 * This service extends the EnhancedWorkerBaseService to provide:
 * - Dual queue processing (BullMQ + SQS)
 * - Intelligent job routing
 * - Graceful fallback to BullMQ
 * - Backward compatibility with existing StandardWorkerService
 */
@Injectable()
export class EnhancedStandardWorkerService extends EnhancedWorkerBaseService {
  constructor(
    bullMqService: BullMqService,
    queueProviderFactory?: QueueProviderFactory,
    workflowInMemoryProviderService?: WorkflowInMemoryProviderService
  ) {
    super(JobTopicNameEnum.STANDARD, bullMqService, queueProviderFactory, workflowInMemoryProviderService);

    Logger.log(`Enhanced Standard Worker Service created`, LOG_CONTEXT);
  }

  /**
   * Initialize the worker with a custom processor
   *
   * @param processor - Function to process jobs from the queue
   * @param workerOptions - BullMQ worker options (used in legacy mode)
   */
  public async initWorker(processor: QueueProcessor, workerOptions?: any): Promise<void> {
    Logger.log(`Initializing enhanced standard worker`, LOG_CONTEXT);

    // Wrap the processor to add standard worker specific logic
    const enhancedProcessor: QueueProcessor = async (jobData) => {
      try {
        Logger.verbose(`Processing standard job`, LOG_CONTEXT);
        await processor(jobData);
        Logger.verbose(`Standard job processing completed`, LOG_CONTEXT);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.error(`Standard job processing failed: ${errorMessage}`, LOG_CONTEXT);
        throw error;
      }
    };

    // Call the base class initialization with our enhanced processor
    await super.initWorker(enhancedProcessor, workerOptions);
  }

  /**
   * Get enhanced status including standard worker specific information
   */
  public getEnhancedStatus() {
    const baseStatus = this.getWorkerStatus();

    return {
      ...baseStatus,
      workerType: 'standard',
      canProcessDelayedJobs: true,
      supportsJobRouting: this.isUsingEnhancedMode(),
    };
  }

  /**
   * Check if this worker can handle delayed jobs based on current configuration
   */
  public canHandleDelayedJobs(): boolean {
    // In enhanced mode, delayed jobs > 15 minutes are automatically routed to BullMQ
    // In legacy mode, all jobs go to BullMQ which supports delays
    return true;
  }
}

/**
 * Factory function to create the appropriate worker service based on availability of dependencies
 *
 * This allows for gradual adoption - if the new dependencies are available, use enhanced mode,
 * otherwise fall back to legacy mode
 */
export function createStandardWorkerService(
  bullMqService: BullMqService,
  queueProviderFactory?: QueueProviderFactory,
  workflowInMemoryProviderService?: WorkflowInMemoryProviderService
): EnhancedStandardWorkerService {
  if (queueProviderFactory && workflowInMemoryProviderService) {
    Logger.log('Creating enhanced standard worker service', LOG_CONTEXT);
    return new EnhancedStandardWorkerService(bullMqService, queueProviderFactory, workflowInMemoryProviderService);
  } else {
    Logger.log('Creating standard worker service in legacy mode', LOG_CONTEXT);
    return new EnhancedStandardWorkerService(bullMqService);
  }
}
