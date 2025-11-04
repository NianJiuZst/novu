import type { AdditionalOperation, RulesLogic } from 'json-logic-js';
import type { ChangePropsValueType } from '../../types/helpers';
import {
  EnvironmentId,
  ExternalSubscriberId,
  OrganizationId,
  SubscriberId,
  TopicId,
  TopicKey,
  TopicSubscriberId,
} from './types';

export enum ConditionType {
  SWITCH = 'switch',
  CUSTOM = 'custom',
}

export enum FilterType {
  WORKFLOW = 'workflow',
}

export type Filter = {
  workflows: string[];
  tags: string[];
};

export type CustomRule = {
  filter?: Filter;
  type: ConditionType.CUSTOM;
  condition: RulesLogic<AdditionalOperation>;
};

export type SwitchRule = {
  filter?: Filter;
  type: ConditionType.SWITCH;
  condition: boolean;
};

export type TopicSubscriberRule = {
  filter?: Filter;
  type: ConditionType;
  condition: boolean | RulesLogic<AdditionalOperation>;
};

export function isSubscriptionCustomRule(rule: TopicSubscriberRule): rule is CustomRule {
  return rule.type === ConditionType.CUSTOM;
}

export function isSubscriptionSwitchRule(rule: TopicSubscriberRule): rule is SwitchRule {
  return rule.type === ConditionType.SWITCH;
}

export class TopicSubscribersEntity {
  _id: TopicSubscriberId;
  _environmentId: EnvironmentId;
  _organizationId: OrganizationId;
  _subscriberId: SubscriberId;
  _topicId: TopicId;
  topicKey: TopicKey;
  // TODO: Rename to subscriberId, to align with workflowId and stepId that are also externally provided identifiers by Novu users
  externalSubscriberId: ExternalSubscriberId;

  name?: string;
  identifier?: string;
  rules?: TopicSubscriberRule[];
  rulesHash?: string;

  createdAt?: string;
  updatedAt?: string;
}

export type TopicSubscribersDBModel = ChangePropsValueType<
  TopicSubscribersEntity,
  '_environmentId' | '_organizationId' | '_subscriberId' | '_topicId'
>;

export type CreateTopicSubscribersEntity = Omit<TopicSubscribersEntity, '_id'>;
