import {
  EncryptedSecret,
  EnvironmentId,
  EnvironmentVariableId,
  IEnvironmentVariable,
  IEnvironmentVariableValue,
  OrganizationId,
} from '@novu/shared';
import { ChangePropsValueType } from '../../types/helpers';

export class EnvironmentVariableValueEntity implements IEnvironmentVariableValue {
  _environmentId: EnvironmentId;
  value: string | EncryptedSecret;
}

export class EnvironmentVariableEntity implements IEnvironmentVariable {
  _id: EnvironmentVariableId;

  _organizationId: OrganizationId;

  key: string;

  isSecret: boolean;

  values: EnvironmentVariableValueEntity[];

  tags?: string[];

  description?: string;

  createdAt: string;

  updatedAt: string;
}

export type EnvironmentVariableDBModel = ChangePropsValueType<EnvironmentVariableEntity, '_organizationId'>;
