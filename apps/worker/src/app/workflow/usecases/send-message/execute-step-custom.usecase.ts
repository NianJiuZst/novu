import { Injectable } from '@nestjs/common';
import { type CreateExecutionDetails, InstrumentUsecase } from '@novu/application-generic';
import type { JobRepository, MessageRepository } from '@novu/dal';

import type { SendMessageCommand } from './send-message.command';
import { type SendMessageResult, SendMessageType } from './send-message-type.usecase';

@Injectable()
export class ExecuteStepCustom extends SendMessageType {
  constructor(
    private jobRepository: JobRepository,
    protected messageRepository: MessageRepository,
    protected createExecutionDetails: CreateExecutionDetails
  ) {
    super(messageRepository, createExecutionDetails);
  }

  @InstrumentUsecase()
  public async execute(command: SendMessageCommand): Promise<SendMessageResult> {
    await this.jobRepository.updateOne(
      { _id: command.job._id, _environmentId: command.environmentId },
      {
        $set: { stepOutput: command.bridgeData?.outputs },
      }
    );

    return {
      status: 'success',
    };
  }
}
