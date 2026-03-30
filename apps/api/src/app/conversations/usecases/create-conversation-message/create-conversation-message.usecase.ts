import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InstrumentUsecase, shortId } from '@novu/application-generic';
import { ConversationMessageRepository, ConversationRepository } from '@novu/dal';
import { ConversationMessageRoleEnum } from '@novu/shared';
import { CreateConversationMessageCommand } from './create-conversation-message.command';

function buildPreview(content: string): string {
  if (content.length <= 200) {
    return content;
  }

  return `${content.slice(0, 200)}…`;
}

@Injectable()
export class CreateConversationMessage {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly conversationMessageRepository: ConversationMessageRepository
  ) {}

  @InstrumentUsecase()
  async execute(command: CreateConversationMessageCommand) {
    const conversation = await this.conversationRepository.findOne({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      identifier: command.conversationIdentifier,
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation not found: ${command.conversationIdentifier}`);
    }

    if (
      command.expectedSubscriberId !== undefined &&
      conversation.subscriberId !== command.expectedSubscriberId
    ) {
      throw new ForbiddenException('Conversation does not belong to this subscriber');
    }

    if (command.platformMessageId) {
      const existing = await this.conversationMessageRepository.findOne({
        _environmentId: command.environmentId,
        _conversationId: conversation._id,
        platformMessageId: command.platformMessageId,
      });

      if (existing) {
        return existing;
      }
    }

    const now = new Date().toISOString();
    const preview = buildPreview(command.content);

    const message = await this.conversationMessageRepository.create({
      identifier: `msg-${shortId(12)}`,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _conversationId: conversation._id,
      role: command.role,
      content: command.content,
      senderName: command.senderName,
      senderAvatar: command.senderAvatar,
      platform: command.platform,
      platformMessageId: command.platformMessageId,
      metadata: command.metadata,
    });

    const titlePatch: Record<string, string> = {};

    if (!conversation.title && command.role === ConversationMessageRoleEnum.USER) {
      const line = command.content.split('\n')[0]?.trim() || command.content;

      titlePatch.title = line.length > 80 ? `${line.slice(0, 80)}…` : line;
    }

    await this.conversationRepository.updateOne(
      {
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        identifier: command.conversationIdentifier,
      },
      {
        $inc: { messageCount: 1 },
        $set: {
          lastMessageAt: now,
          lastMessagePreview: preview,
          ...titlePatch,
        },
      }
    );

    return message;
  }
}
