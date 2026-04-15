import { JobStatusEnum } from '@novu/shared';

/**
 * Only block a trigger when another run for this transaction id is still in flight.
 * Completed (or otherwise terminal) workflow runs must not prevent retries with the same transactionId.
 */
export const ACTIVE_JOB_STATUSES_FOR_TRANSACTION_ID_UNIQUENESS: JobStatusEnum[] = [
  JobStatusEnum.PENDING,
  JobStatusEnum.QUEUED,
  JobStatusEnum.RUNNING,
  JobStatusEnum.DELAYED,
];
