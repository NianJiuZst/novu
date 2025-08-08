import { Injectable, Logger, Optional } from '@nestjs/common';
import { JobTopicNameEnum } from '@novu/shared';
import { BullMqService } from '../bull-mq';
import { WorkflowInMemoryProviderService } from '../in-memory-provider';
import { QueueProviderFactory } from '../queues/queue-provider-factory.service';
import { EnhancedWorkerBaseService } from './enhanced-worker-base.service';

const LOG_CONTEXT = 'SubscriberProcessWorkerService';

@Injectable()
export class SubscriberProcessWorkerService extends EnhancedWorkerBaseService {
  constructor(
    public bullMqService: BullMqService,
    @Optional() queueProviderFactory?: QueueProviderFactory,
    @Optional() workflowInMemoryProviderService?: WorkflowInMemoryProviderService
  ) {
    super(
      JobTopicNameEnum.PROCESS_SUBSCRIBER,
      bullMqService,
      queueProviderFactory,
      workflowInMemoryProviderService
    );

    Logger.log('SubscriberProcessWorkerService initialized with enhanced queue support', LOG_CONTEXT);
  }
}
