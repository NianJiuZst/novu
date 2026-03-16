import { EnvironmentId } from '../../types';

export interface IEnvironmentVariableValueDto {
  _environmentId: EnvironmentId;
  value: string;
}

export interface ICreateEnvironmentVariableDto {
  key: string;
  isSecret?: boolean;
  values?: IEnvironmentVariableValueDto[];
}

export interface IUpdateEnvironmentVariableDto {
  key?: string;
  isSecret?: boolean;
  values?: IEnvironmentVariableValueDto[];
}
