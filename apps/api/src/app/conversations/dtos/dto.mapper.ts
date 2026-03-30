import { ConversationEntity, ConversationMessageEntity } from '@novu/dal';
import { GetConversationMessageResponseDto } from './get-conversation-message-response.dto';
import { GetConversationResponseDto } from './get-conversation-response.dto';

export function mapConversationEntityToDto(entity: ConversationEntity): GetConversationResponseDto {
  return {
    id: entity.identifier,
    subscriberId: entity.subscriberId,
    agentId: entity.agentId,
    status: entity.status,
    platform: entity.platform,
    platformThreadId: entity.platformThreadId,
    title: entity.title,
    lastMessageAt: entity.lastMessageAt,
    lastMessagePreview: entity.lastMessagePreview,
    messageCount: entity.messageCount,
    metadata: entity.metadata,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export function mapConversationMessageEntityToDto(
  entity: ConversationMessageEntity,
  conversationIdentifier: string
): GetConversationMessageResponseDto {
  return {
    id: entity.identifier,
    conversationId: conversationIdentifier,
    role: entity.role,
    content: entity.content,
    senderName: entity.senderName,
    senderAvatar: entity.senderAvatar,
    platform: entity.platform,
    platformMessageId: entity.platformMessageId,
    metadata: entity.metadata,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
