import { Injectable, Logger, Optional } from '@nestjs/common';
import { JobTopicNameEnum } from '@novu/shared';
import { BullMqService } from '../bull-mq';
import { FeatureFlagsService } from '../feature-flags';
import { WorkflowInMemoryProviderService } from '../in-memory-provider';
import { QueueProviderFactory } from '../queues/queue-provider-factory.service';
import { EnhancedWorkerBaseService } from './enhanced-worker-base.service';
import { WorkerBaseService } from './worker-base.service';

const LOG_CONTEXT = 'StandardWorkerService';

@Injectable()
export class StandardWorkerService extends EnhancedWorkerBaseService {
  constructor(
    public bullMqService: BullMqService,
    @Optional() queueProviderFactory?: QueueProviderFactory,
    @Optional() workflowInMemoryProviderService?: WorkflowInMemoryProviderService
  ) {
    super(JobTopicNameEnum.STANDARD, bullMqService, queueProviderFactory, workflowInMemoryProviderService);

    Logger.log('StandardWorkerService initialized with enhanced queue support', LOG_CONTEXT);
  }
}
