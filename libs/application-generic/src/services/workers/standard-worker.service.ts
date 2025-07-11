import { JobTopicNameEnum } from '@novu/shared';
import type { BullMqService } from '../bull-mq';
import { WorkerBaseService } from './index';

const LOG_CONTEXT = 'StandardWorkerService';

export class StandardWorkerService extends WorkerBaseService {
  constructor(public bullMqService: BullMqService) {
    super(JobTopicNameEnum.STANDARD, bullMqService);
  }
}
