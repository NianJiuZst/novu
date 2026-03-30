import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InstrumentUsecase } from '@novu/application-generic';
import {
  ConversationMessageDBModel,
  ConversationMessageEntity,
  ConversationMessageRepository,
  ConversationRepository,
  EnforceEnvOrOrgIds,
} from '@novu/dal';
import { DirectionEnum } from '@novu/shared';
import { FilterQuery } from 'mongoose';
import { ListConversationMessagesCommand } from './list-conversation-messages.command';

@Injectable()
export class ListConversationMessages {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly conversationMessageRepository: ConversationMessageRepository
  ) {}

  @InstrumentUsecase()
  async execute(command: ListConversationMessagesCommand) {
    const conversation = await this.conversationRepository.findOne({
      _environmentId: command.user.environmentId,
      _organizationId: command.user.organizationId,
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

    const filter: FilterQuery<ConversationMessageDBModel> & EnforceEnvOrOrgIds = {
      _environmentId: command.user.environmentId,
      _organizationId: command.user.organizationId,
      _conversationId: conversation._id,
    };

    const orderBy = command.orderBy || 'createdAt';
    const sortDirection = command.orderDirection || DirectionEnum.ASC;

    let cursorEntity: ConversationMessageEntity | null = null;
    const id = command.before || command.after;

    if (id) {
      cursorEntity = await this.conversationMessageRepository.findOne({
        _environmentId: command.user.environmentId,
        _organizationId: command.user.organizationId,
        _id: id,
        _conversationId: conversation._id,
      });

      if (!cursorEntity) {
        return {
          data: [],
          next: null,
          previous: null,
          totalCount: 0,
          totalCountCapped: false,
        };
      }
    }

    const afterCursor =
      command.after && cursorEntity
        ? {
            sortBy: cursorEntity[orderBy],
            paginateField: cursorEntity._id,
          }
        : undefined;

    const beforeCursor =
      command.before && cursorEntity
        ? {
            sortBy: cursorEntity[orderBy],
            paginateField: cursorEntity._id,
          }
        : undefined;

    const pagination = await this.conversationMessageRepository.findWithCursorBasedPagination({
      query: filter,
      paginateField: '_id',
      sortBy: orderBy,
      sortDirection,
      limit: command.limit,
      after: afterCursor,
      before: beforeCursor,
      includeCursor: command.includeCursor,
    });

    return {
      data: pagination.data,
      next: pagination.next,
      previous: pagination.previous,
      totalCount: pagination.totalCount,
      totalCountCapped: pagination.totalCountCapped,
      conversationIdentifier: conversation.identifier,
    };
  }
}
