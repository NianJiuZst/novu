import { Inject, Injectable, Logger } from '@nestjs/common';
import { JobTopicNameEnum } from '@novu/shared';
import { BullMqService } from '../bull-mq';
import { WorkflowInMemoryProviderService } from '../in-memory-provider';
import { QueueBaseService } from './queue-base.service';
import { QueueProviderFactory } from './queue-provider-factory.service';

const LOG_CONTEXT = 'ActiveJobsMetricQueueService';

@Injectable()
export class ActiveJobsMetricQueueService extends QueueBaseService {
  constructor(
    public workflowInMemoryProviderService: WorkflowInMemoryProviderService,
    private queueProviderFactory?: QueueProviderFactory
  ) {
    super(
      JobTopicNameEnum.ACTIVE_JOBS_METRIC,
      new BullMqService(workflowInMemoryProviderService),
      queueProviderFactory
    );

    Logger.log(`Creating queue ${this.topic}`, LOG_CONTEXT);

    this.createQueue();
  }
}
