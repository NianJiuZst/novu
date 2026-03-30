import type { ConversationStatus, ListConversationMessagesResult, ListConversationsResult } from '../types';

export type ListConversationsArgs = {
  limit?: number;
  after?: string;
  before?: string;
  orderBy?: 'createdAt' | 'updatedAt' | 'lastMessageAt';
  orderDirection?: 'ASC' | 'DESC';
  includeCursor?: boolean;
  agentId?: string;
  status?: ConversationStatus;
};

export type ListConversationMessagesArgs = {
  limit?: number;
  after?: string;
  before?: string;
  orderBy?: 'createdAt' | 'updatedAt';
  orderDirection?: 'ASC' | 'DESC';
  includeCursor?: boolean;
};

export type { ListConversationMessagesResult, ListConversationsResult };
