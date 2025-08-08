import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { JobTopicNameEnum } from '@novu/shared';
import { IProcessSubscriberBulkJobDto, IProcessSubscriberJobDto } from '../../dtos/process-subscriber-job.dto';
import { BullMqService } from '../bull-mq';
import { WorkflowInMemoryProviderService } from '../in-memory-provider';
import { QueueBaseService } from './queue-base.service';
import { QueueProviderFactory } from './queue-provider-factory.service';

@Injectable()
export class SubscriberProcessQueueService extends QueueBaseService {
  private readonly LOG_CONTEXT = 'SubscriberProcessQueueService';
  constructor(
    @Inject(forwardRef(() => WorkflowInMemoryProviderService))
    public workflowInMemoryProviderService: WorkflowInMemoryProviderService,
    private queueProviderFactory?: QueueProviderFactory
  ) {
    super(
      JobTopicNameEnum.PROCESS_SUBSCRIBER,
      new BullMqService(workflowInMemoryProviderService),
      queueProviderFactory
    );

    Logger.log(`Creating queue ${this.topic}`, this.LOG_CONTEXT);

    this.createQueue();
  }

  public async add(data: IProcessSubscriberJobDto) {
    return await super.add(data);
  }

  public async addBulk(data: IProcessSubscriberBulkJobDto[]) {
    return await super.addBulk(data);
  }
}
