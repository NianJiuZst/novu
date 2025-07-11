import { JobTopicNameEnum } from '@novu/shared';
import type { BullMqService } from '../bull-mq';
import { WorkerBaseService } from './index';

const LOG_CONTEXT = 'WorkflowWorkerService';

export class WorkflowWorkerService extends WorkerBaseService {
  constructor(public bullMqService: BullMqService) {
    super(JobTopicNameEnum.WORKFLOW, bullMqService);
  }
}
