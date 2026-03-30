import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ExternalApiAccessible, RequirePermissions } from '@novu/application-generic';
import { ApiRateLimitCategoryEnum, PermissionsEnum, UserSessionData } from '@novu/shared';
import { RequireAuthentication } from '../auth/framework/auth.decorator';
import { ThrottlerCategory } from '../rate-limiting/guards/throttler.decorator';
import { ApiCommonResponses, ApiResponse } from '../shared/framework/response.decorator';
import { SdkGroupName, SdkMethodName } from '../shared/framework/swagger/sdk.decorators';
import { UserSession } from '../shared/framework/user.decorator';
import { CreateConversationMessageRequestDto } from './dtos/create-conversation-message-request.dto';
import { CreateConversationRequestDto } from './dtos/create-conversation-request.dto';
import {
  mapConversationEntityToDto,
  mapConversationMessageEntityToDto,
} from './dtos/dto.mapper';
import { GetConversationMessageResponseDto } from './dtos/get-conversation-message-response.dto';
import { GetConversationResponseDto } from './dtos/get-conversation-response.dto';
import { ListConversationMessagesQueryDto } from './dtos/list-conversation-messages-query.dto';
import { ListConversationMessagesResponseDto } from './dtos/list-conversation-messages-response.dto';
import { ListConversationsQueryDto } from './dtos/list-conversations-query.dto';
import { ListConversationsResponseDto } from './dtos/list-conversations-response.dto';
import { UpdateConversationRequestDto } from './dtos/update-conversation-request.dto';
import { CreateConversationCommand } from './usecases/create-conversation/create-conversation.command';
import { CreateConversation } from './usecases/create-conversation/create-conversation.usecase';
import { CreateConversationMessageCommand } from './usecases/create-conversation-message/create-conversation-message.command';
import { CreateConversationMessage } from './usecases/create-conversation-message/create-conversation-message.usecase';
import { GetConversationCommand } from './usecases/get-conversation/get-conversation.command';
import { GetConversation } from './usecases/get-conversation/get-conversation.usecase';
import { ListConversationMessagesCommand } from './usecases/list-conversation-messages/list-conversation-messages.command';
import { ListConversationMessages } from './usecases/list-conversation-messages/list-conversation-messages.usecase';
import { ListConversationsCommand } from './usecases/list-conversations/list-conversations.command';
import { ListConversations } from './usecases/list-conversations/list-conversations.usecase';
import { UpdateConversationCommand } from './usecases/update-conversation/update-conversation.command';
import { UpdateConversation } from './usecases/update-conversation/update-conversation.usecase';

@ThrottlerCategory(ApiRateLimitCategoryEnum.CONFIGURATION)
@Controller({ path: '/conversations', version: '1' })
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('Conversations')
@SdkGroupName('Conversations')
@RequireAuthentication()
@ApiCommonResponses()
export class ConversationsController {
  constructor(
    private readonly listConversationsUsecase: ListConversations,
    private readonly createConversationUsecase: CreateConversation,
    private readonly getConversationUsecase: GetConversation,
    private readonly updateConversationUsecase: UpdateConversation,
    private readonly createConversationMessageUsecase: CreateConversationMessage,
    private readonly listConversationMessagesUsecase: ListConversationMessages
  ) {}

  @Get()
  @ApiOperation({ summary: 'List conversations' })
  @ApiResponse(ListConversationsResponseDto, 200)
  @SdkMethodName('list')
  @RequirePermissions(PermissionsEnum.SUBSCRIBER_READ)
  @ExternalApiAccessible()
  async listConversations(
    @UserSession() user: UserSessionData,
    @Query() query: ListConversationsQueryDto
  ): Promise<ListConversationsResponseDto> {
    const result = await this.listConversationsUsecase.execute(
      ListConversationsCommand.create({
        user,
        limit: query.limit || 10,
        after: query.after,
        before: query.before,
        orderDirection: query.orderDirection,
        orderBy: query.orderBy || 'updatedAt',
        includeCursor: query.includeCursor,
        subscriberId: query.subscriberId,
        agentId: query.agentId,
        status: query.status,
      })
    );

    return {
      data: result.data.map(mapConversationEntityToDto),
      next: result.next,
      previous: result.previous,
      totalCount: result.totalCount!,
      totalCountCapped: result.totalCountCapped!,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create or return existing conversation (dedupe by platformThreadId)' })
  @ApiResponse(GetConversationResponseDto, 201)
  @SdkMethodName('create')
  @RequirePermissions(PermissionsEnum.SUBSCRIBER_WRITE)
  @ExternalApiAccessible()
  async createConversation(
    @UserSession() user: UserSessionData,
    @Body() body: CreateConversationRequestDto
  ): Promise<GetConversationResponseDto> {
    const conversation = await this.createConversationUsecase.execute(
      CreateConversationCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        subscriberId: body.subscriberId,
        agentId: body.agentId,
        platform: body.platform,
        platformThreadId: body.platformThreadId,
        title: body.title,
        metadata: body.metadata,
      })
    );

    return mapConversationEntityToDto(conversation);
  }

  @Get('/:identifier/messages')
  @ApiOperation({ summary: 'List messages in a conversation' })
  @ApiParam({ name: 'identifier', type: String })
  @ApiResponse(ListConversationMessagesResponseDto, 200)
  @SdkMethodName('listMessages')
  @RequirePermissions(PermissionsEnum.SUBSCRIBER_READ)
  @ExternalApiAccessible()
  async listConversationMessages(
    @UserSession() user: UserSessionData,
    @Param('identifier') identifier: string,
    @Query() query: ListConversationMessagesQueryDto
  ): Promise<ListConversationMessagesResponseDto> {
    const result = await this.listConversationMessagesUsecase.execute(
      ListConversationMessagesCommand.create({
        user,
        limit: query.limit || 50,
        after: query.after,
        before: query.before,
        orderDirection: query.orderDirection,
        orderBy: query.orderBy || 'createdAt',
        includeCursor: query.includeCursor,
        conversationIdentifier: identifier,
      })
    );

    return {
      data: result.data.map((row) =>
        mapConversationMessageEntityToDto(row, result.conversationIdentifier ?? identifier)
      ),
      next: result.next,
      previous: result.previous,
      totalCount: result.totalCount!,
      totalCountCapped: result.totalCountCapped!,
    };
  }

  @Post('/:identifier/messages')
  @ApiOperation({ summary: 'Append a message to a conversation' })
  @ApiParam({ name: 'identifier', type: String })
  @ApiResponse(GetConversationMessageResponseDto, 201)
  @SdkMethodName('createMessage')
  @RequirePermissions(PermissionsEnum.SUBSCRIBER_WRITE)
  @ExternalApiAccessible()
  async createConversationMessage(
    @UserSession() user: UserSessionData,
    @Param('identifier') identifier: string,
    @Body() body: CreateConversationMessageRequestDto
  ): Promise<GetConversationMessageResponseDto> {
    const message = await this.createConversationMessageUsecase.execute(
      CreateConversationMessageCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        conversationIdentifier: identifier,
        role: body.role,
        content: body.content,
        senderName: body.senderName,
        senderAvatar: body.senderAvatar,
        platform: body.platform,
        platformMessageId: body.platformMessageId,
        metadata: body.metadata,
      })
    );

    return mapConversationMessageEntityToDto(message, identifier);
  }

  @Get('/:identifier')
  @ApiOperation({ summary: 'Get a conversation by identifier' })
  @ApiParam({ name: 'identifier', type: String })
  @ApiResponse(GetConversationResponseDto, 200)
  @SdkMethodName('retrieve')
  @RequirePermissions(PermissionsEnum.SUBSCRIBER_READ)
  @ExternalApiAccessible()
  async getConversation(
    @UserSession() user: UserSessionData,
    @Param('identifier') identifier: string
  ): Promise<GetConversationResponseDto> {
    const conversation = await this.getConversationUsecase.execute(
      GetConversationCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        identifier,
      })
    );

    return mapConversationEntityToDto(conversation);
  }

  @Patch('/:identifier')
  @ApiOperation({ summary: 'Update a conversation' })
  @ApiParam({ name: 'identifier', type: String })
  @ApiResponse(GetConversationResponseDto, 200)
  @SdkMethodName('update')
  @RequirePermissions(PermissionsEnum.SUBSCRIBER_WRITE)
  @ExternalApiAccessible()
  async updateConversation(
    @UserSession() user: UserSessionData,
    @Param('identifier') identifier: string,
    @Body() body: UpdateConversationRequestDto
  ): Promise<GetConversationResponseDto> {
    const conversation = await this.updateConversationUsecase.execute(
      UpdateConversationCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        identifier,
        status: body.status,
        title: body.title,
        metadata: body.metadata,
      })
    );

    return mapConversationEntityToDto(conversation);
  }
}
