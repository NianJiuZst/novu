import { JobTopicNameEnum } from '@novu/shared';

export interface IQueueProvider {
  add(params: IJobParams): Promise<void>;
  addBulk(data: IBulkJobParams[]): Promise<void>;
  gracefulShutdown(): Promise<void>;
  createWorker(topic: JobTopicNameEnum, processor: QueueProcessor): void;
  pause?(): Promise<void>;
  resume?(): Promise<void>;
}

export type QueueProcessor = (job: IJobData) => Promise<void>;

export interface IJobParams {
  name: string;
  data?: unknown;
  topic: JobTopicNameEnum;
  groupId?: string;
  options?: JobOptions;
}

export interface IBulkJobParams {
  name: string;
  data: unknown;
  topic: JobTopicNameEnum;
  groupId?: string;
  options?: JobOptions;
}

export interface JobOptions {
  delay?: number;
  attempts?: number;
  backoff?:
    | {
        type: string;
        delay?: number;
      }
    | number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  [key: string]: unknown;
}

export interface IJobData {
  _environmentId: string;
  _id: string;
  _organizationId: string;
  _userId: string;
  [key: string]: unknown;
}
