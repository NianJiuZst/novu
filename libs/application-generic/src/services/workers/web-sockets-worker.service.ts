import { JobTopicNameEnum } from '@novu/shared';
import type { BullMqService } from '../bull-mq';
import { WorkerBaseService } from './index';

const LOG_CONTEXT = 'WebSocketsWorkerService';

export class WebSocketsWorkerService extends WorkerBaseService {
  constructor(public bullMqService: BullMqService) {
    super(JobTopicNameEnum.WEB_SOCKETS, bullMqService);
  }
}
