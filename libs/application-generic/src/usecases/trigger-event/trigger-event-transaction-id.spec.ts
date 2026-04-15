import { JobStatusEnum } from '@novu/shared';
import { describe, expect, it } from 'vitest';
import { ACTIVE_JOB_STATUSES_FOR_TRANSACTION_ID_UNIQUENESS } from './trigger-event-transaction-id.constants';

describe('transactionId uniqueness guard', () => {
  it('only considers non-terminal job statuses so completed runs do not block retries', () => {
    expect(ACTIVE_JOB_STATUSES_FOR_TRANSACTION_ID_UNIQUENESS).toContain(JobStatusEnum.PENDING);
    expect(ACTIVE_JOB_STATUSES_FOR_TRANSACTION_ID_UNIQUENESS).toContain(JobStatusEnum.QUEUED);
    expect(ACTIVE_JOB_STATUSES_FOR_TRANSACTION_ID_UNIQUENESS).toContain(JobStatusEnum.RUNNING);
    expect(ACTIVE_JOB_STATUSES_FOR_TRANSACTION_ID_UNIQUENESS).toContain(JobStatusEnum.DELAYED);

    expect(ACTIVE_JOB_STATUSES_FOR_TRANSACTION_ID_UNIQUENESS).not.toContain(JobStatusEnum.COMPLETED);
    expect(ACTIVE_JOB_STATUSES_FOR_TRANSACTION_ID_UNIQUENESS).not.toContain(JobStatusEnum.FAILED);
    expect(ACTIVE_JOB_STATUSES_FOR_TRANSACTION_ID_UNIQUENESS).not.toContain(JobStatusEnum.CANCELED);
    expect(ACTIVE_JOB_STATUSES_FOR_TRANSACTION_ID_UNIQUENESS).not.toContain(JobStatusEnum.MERGED);
    expect(ACTIVE_JOB_STATUSES_FOR_TRANSACTION_ID_UNIQUENESS).not.toContain(JobStatusEnum.SKIPPED);
  });
});
