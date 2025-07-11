import type { ICredentials } from '../../entities/integration';
import type { BuilderFieldType, BuilderGroupValues, EnvironmentId, FilterParts } from '../../types';

export type ICredentialsDto = ICredentials;

export interface IConstructIntegrationDto {
  name?: string;
  identifier?: string;
  _environmentId?: EnvironmentId;
  credentials?: ICredentialsDto;
  active?: boolean;
  check?: boolean;
  conditions?: {
    isNegated?: boolean;
    type?: BuilderFieldType;
    value?: BuilderGroupValues;
    children?: FilterParts[];
  }[];
}
