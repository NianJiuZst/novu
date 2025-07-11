import type { ResourceOriginEnum, ResourceTypeEnum } from '@novu/shared';
import type { ChangePropsValueType } from '../../types/helpers';
import type { ControlSchemas } from '../message-template';
import type {
  ChannelTypeEnum,
  EnvironmentId,
  ITemplateVariable,
  LayoutDescription,
  LayoutId,
  LayoutIdentifier,
  LayoutName,
  OrganizationId,
  UserId,
} from './types';

export class LayoutEntity {
  _id: LayoutId;
  _environmentId: EnvironmentId;
  _organizationId: OrganizationId;
  _creatorId: UserId;
  _parentId?: LayoutId;
  name: LayoutName;
  identifier: LayoutIdentifier;
  description?: LayoutDescription;
  variables?: ITemplateVariable[];
  content?: string;
  contentType?: string;
  isDefault: boolean;
  deleted: boolean;
  channel: ChannelTypeEnum;
  type?: ResourceTypeEnum;
  origin?: ResourceOriginEnum;
  createdAt?: string;
  updatedAt?: string;
  controls?: ControlSchemas;
}

export type LayoutDBModel = ChangePropsValueType<
  LayoutEntity,
  '_environmentId' | '_organizationId' | '_creatorId' | '_parentId'
>;
