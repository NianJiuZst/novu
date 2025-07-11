import { Injectable } from '@nestjs/common';
import type { MessageTemplateEntity, MessageTemplateRepository } from '@novu/dal';

import type { FindMessageTemplatesByLayoutCommand } from './find-message-templates-by-layout.command';

const DEFAULT_PAGE_SIZE = 100;

@Injectable()
export class FindMessageTemplatesByLayoutUseCase {
  constructor(private messageTemplateRepository: MessageTemplateRepository) {}

  async execute(command: FindMessageTemplatesByLayoutCommand): Promise<MessageTemplateEntity[]> {
    // TODO: Implement proper pagination
    const messageTemplates = await this.messageTemplateRepository.getMessageTemplatesByLayout(
      command.environmentId,
      command.layoutId,
      { limit: DEFAULT_PAGE_SIZE }
    );

    return messageTemplates;
  }
}
