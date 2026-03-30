import { ConversationStatusEnum } from '@novu/shared';
import type { ChangePropsValueType } from '../../types/helpers';
import type { EnvironmentId } from '../environment';
import type { OrganizationId } from '../organization';

export class ConversationEntity {
  _id: string;
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

export type ConversationDBModel = ChangePropsValueType<
  ConversationEntity,
  '_environmentId' | '_organizationId'
>;
