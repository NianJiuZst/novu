import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InstrumentUsecase } from '@novu/application-generic';
import { ConversationRepository } from '@novu/dal';
import { UpdateConversationCommand } from './update-conversation.command';

@Injectable()
export class UpdateConversation {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  @InstrumentUsecase()
  async execute(command: UpdateConversationCommand) {
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

    const $set: Record<string, unknown> = {};

    if (command.status !== undefined) {
      $set.status = command.status;
    }

    if (command.title !== undefined) {
      $set.title = command.title;
    }

    if (command.metadata !== undefined) {
      $set.metadata = command.metadata;
    }

    if (Object.keys($set).length === 0) {
      return conversation;
    }

    await this.conversationRepository.updateOne(
      {
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        identifier: command.identifier,
      },
      { $set }
    );

    const updated = await this.conversationRepository.findOne({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      identifier: command.identifier,
    });

    if (!updated) {
      throw new NotFoundException(`Conversation not found: ${command.identifier}`);
    }

    return updated;
  }
}
