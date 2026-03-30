import { Injectable } from '@nestjs/common';
import { InstrumentUsecase } from '@novu/application-generic';
import {
  ConversationDBModel,
  ConversationEntity,
  ConversationRepository,
  EnforceEnvOrOrgIds,
} from '@novu/dal';
import { DirectionEnum } from '@novu/shared';
import { FilterQuery } from 'mongoose';
import { ListConversationsCommand } from './list-conversations.command';

@Injectable()
export class ListConversations {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  @InstrumentUsecase()
  async execute(command: ListConversationsCommand) {
    const filter: FilterQuery<ConversationDBModel> & EnforceEnvOrOrgIds = {
      _environmentId: command.user.environmentId,
      _organizationId: command.user.organizationId,
    };

    if (command.subscriberId) {
      filter.subscriberId = command.subscriberId;
    }

    if (command.agentId) {
      filter.agentId = command.agentId;
    }

    if (command.status) {
      filter.status = command.status;
    }

    const orderBy = command.orderBy || 'updatedAt';

    let cursorEntity: ConversationEntity | null = null;
    const id = command.before || command.after;

    if (id) {
      cursorEntity = await this.conversationRepository.findOne({
        _environmentId: command.user.environmentId,
        _organizationId: command.user.organizationId,
        _id: id,
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
            sortBy: cursorEntity[orderBy] ?? cursorEntity.updatedAt,
            paginateField: cursorEntity._id,
          }
        : undefined;

    const beforeCursor =
      command.before && cursorEntity
        ? {
            sortBy: cursorEntity[orderBy] ?? cursorEntity.updatedAt,
            paginateField: cursorEntity._id,
          }
        : undefined;

    const pagination = await this.conversationRepository.findWithCursorBasedPagination({
      query: filter,
      paginateField: '_id',
      sortBy: orderBy,
      sortDirection: command.orderDirection || DirectionEnum.DESC,
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
    };
  }
}
