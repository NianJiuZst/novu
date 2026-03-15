import { EncryptedSecret, EnvironmentId, EnvironmentVariableId, OrganizationId } from '../../types';

export interface IEnvironmentVariableValue {
  _environmentId: EnvironmentId;
  value: string | EncryptedSecret;
}

export interface IEnvironmentVariable {
  _id: EnvironmentVariableId;
  _organizationId: OrganizationId;
  key: string;
  isSecret: boolean;
  values: IEnvironmentVariableValue[];
  createdAt: string;
  updatedAt: string;
}
