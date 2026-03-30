import { Injectable, Logger } from '@nestjs/common';
import { CreateExecutionDetails, CreateExecutionDetailsCommand, DetailEnum } from '@novu/application-generic';
import { ExecutionDetailsSourceEnum, ExecutionDetailsStatusEnum } from '@novu/shared';

import { WebhookFilterBackoffStrategyCommand } from './webhook-filter-backoff-strategy.command';

function safeExtractErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  try {
    const parsed = JSON.parse(message);

    return typeof parsed?.message === 'string' ? parsed.message : message;
  } catch {
    return message;
  }
}

@Injectable()
export class WebhookFilterBackoffStrategy {
  constructor(private createExecutionDetails: CreateExecutionDetails) {}

  public async execute(command: WebhookFilterBackoffStrategyCommand): Promise<number> {
    const { attemptsMade, eventError: error, eventJob } = command;
    const job = eventJob.data;

    try {
      await this.createExecutionDetails.execute(
        CreateExecutionDetailsCommand.create({
          ...CreateExecutionDetailsCommand.getDetailsFromJob(job),
          detail: DetailEnum.WEBHOOK_FILTER_FAILED_RETRY,
          source: ExecutionDetailsSourceEnum.WEBHOOK,
          status: ExecutionDetailsStatusEnum.PENDING,
          isTest: false,
          isRetry: true,
          raw: JSON.stringify({ message: safeExtractErrorMessage(error), attempt: attemptsMade }),
        })
      );
    } catch (anotherError) {
      Logger.error(
        anotherError,
        'Failed to create the execution details for backoff strategy',
        'WebhookFilterBackoffStrategy'
      );
    }

    return Math.round(Math.random() * 2 ** attemptsMade * 1000);
  }
}
