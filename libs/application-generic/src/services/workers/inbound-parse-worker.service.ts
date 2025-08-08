import { Injectable, Logger, Optional } from '@nestjs/common';
import { JobTopicNameEnum } from '@novu/shared';
import { BullMqService } from '../bull-mq';
import { WorkflowInMemoryProviderService } from '../in-memory-provider';
import { QueueProviderFactory } from '../queues/queue-provider-factory.service';
import { EnhancedWorkerBaseService } from './enhanced-worker-base.service';

const LOG_CONTEXT = 'InboundParseWorkerService';

@Injectable()
export class InboundParseWorkerService extends EnhancedWorkerBaseService {
  constructor(
    public bullMqService: BullMqService,
    @Optional() queueProviderFactory?: QueueProviderFactory,
    @Optional() workflowInMemoryProviderService?: WorkflowInMemoryProviderService
  ) {
    super(
      JobTopicNameEnum.INBOUND_PARSE_MAIL,
      bullMqService,
      queueProviderFactory,
      workflowInMemoryProviderService
    );

    Logger.log('InboundParseWorkerService initialized with enhanced queue support', LOG_CONTEXT);
  }
}
