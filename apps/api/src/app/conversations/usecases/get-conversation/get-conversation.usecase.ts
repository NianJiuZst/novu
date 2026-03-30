import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InstrumentUsecase } from '@novu/application-generic';
import { ConversationRepository } from '@novu/dal';
import { GetConversationCommand } from './get-conversation.command';

@Injectable()
export class GetConversation {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  @InstrumentUsecase()
  async execute(command: GetConversationCommand) {
    const conversation = await this.conversationRepository.findOne({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      identifier: command.identifier,
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation not found: ${command.identifier}`);
    }

    if (
      command.expectedSubscriberId !== undefined &&
      conversation.subscriberId !== command.expectedSubscriberId
    ) {
      throw new ForbiddenException('Conversation does not belong to this subscriber');
    }

    return conversation;
  }
}
