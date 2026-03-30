import { Injectable } from '@nestjs/common';
import { InstrumentUsecase, shortId } from '@novu/application-generic';
import { ConversationRepository } from '@novu/dal';
import { ConversationStatusEnum } from '@novu/shared';
import { CreateConversationCommand } from './create-conversation.command';

function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  );
}

@Injectable()
export class CreateConversation {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  @InstrumentUsecase()
  async execute(command: CreateConversationCommand) {
    if (command.platformThreadId) {
      const existing = await this.conversationRepository.findOne({
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        agentId: command.agentId,
        platformThreadId: command.platformThreadId,
      });

      if (existing) {
        return existing;
      }
    }

    const identifier = `conv-${shortId(12)}`;

    try {
      return await this.conversationRepository.create({
        identifier,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        subscriberId: command.subscriberId,
        agentId: command.agentId,
        status: ConversationStatusEnum.ACTIVE,
        platform: command.platform,
        platformThreadId: command.platformThreadId,
        title: command.title,
        messageCount: 0,
        metadata: command.metadata,
      });
    } catch (error) {
      if (isMongoDuplicateKeyError(error) && command.platformThreadId) {
        const existing = await this.conversationRepository.findOne({
          _environmentId: command.environmentId,
          _organizationId: command.organizationId,
          agentId: command.agentId,
          platformThreadId: command.platformThreadId,
        });

        if (existing) {
          return existing;
        }
      }

      throw error;
    }
  }
}
