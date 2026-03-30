import { ConversationMessageRoleEnum } from '@novu/shared';
import type { ChangePropsValueType } from '../../types/helpers';
import type { EnvironmentId } from '../environment';
import type { OrganizationId } from '../organization';

export class ConversationMessageEntity {
  _id: string;
  identifier: string;

  _organizationId: OrganizationId;
  _environmentId: EnvironmentId;
  _conversationId: string;

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

export type ConversationMessageDBModel = ChangePropsValueType<
  ConversationMessageEntity,
  '_environmentId' | '_organizationId' | '_conversationId'
>;
