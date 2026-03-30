import type { EnvironmentId } from './environment';
import type { OrganizationId } from './organization';

export enum ConversationStatusEnum {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ABANDONED = 'abandoned',
}

export enum ConversationMessageRoleEnum {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface Conversation {
  identifier: string;
  _organizationId: OrganizationId;
  _environmentId: EnvironmentId;
  subscriberId: string;
  agentId: string;
  status: ConversationStatusEnum;
  platform?: string;
  platformThreadId?: string;
  title?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  messageCount: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  identifier: string;
  _organizationId: OrganizationId;
  _environmentId: EnvironmentId;
  conversationId: string;
  role: ConversationMessageRoleEnum;
  content: string;
  senderName?: string;
  senderAvatar?: string;
  platform?: string;
  platformMessageId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
