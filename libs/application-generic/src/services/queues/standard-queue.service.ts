import { Injectable, Logger } from '@nestjs/common';
import { JobTopicNameEnum } from '@novu/shared';
import type { IStandardBulkJobDto, IStandardJobDto } from '../../dtos';
import { BullMqService } from '../bull-mq';
import type { WorkflowInMemoryProviderService } from '../in-memory-provider';
import { QueueBaseService } from './queue-base.service';

const LOG_CONTEXT = 'StandardQueueService';

@Injectable()
export class StandardQueueService extends QueueBaseService {
  constructor(public workflowInMemoryProviderService: WorkflowInMemoryProviderService) {
    super(JobTopicNameEnum.STANDARD, new BullMqService(workflowInMemoryProviderService));

    Logger.log(`Creating queue ${this.topic}`, LOG_CONTEXT);

    this.createQueue();
  }

  public async add(data: IStandardJobDto) {
    return await super.add(data);
  }

  public async addBulk(data: IStandardBulkJobDto[]) {
    return await super.addBulk(data);
  }
}
