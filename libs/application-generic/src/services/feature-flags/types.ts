import { EnvironmentEntity, OrganizationEntity, UserEntity } from '@novu/dal';
import { FeatureFlagsKeysEnum } from '@novu/shared';

type PartialWithId<T> = Partial<T> & { _id: string };

type RequireAtLeastOne<T> = {
  [K in keyof T]: { [P in K]: T[P] } & Partial<T>;
}[keyof T];

export type FeatureFlagContextBase = RequireAtLeastOne<{
  environment: PartialWithId<EnvironmentEntity>;
  organization: PartialWithId<OrganizationEntity>;
  user: PartialWithId<UserEntity>;
}>;

export type FeatureFlagContext<T_Result> = FeatureFlagContextBase & {
  key: FeatureFlagsKeysEnum;
  defaultValue: T_Result;
};

export interface IFeatureFlagsService {
  isEnabled: boolean;

  initialize: () => Promise<void>;

  gracefullyShutdown: () => Promise<void>;

  getFlag: <T_Result>(context: FeatureFlagContext<T_Result>) => Promise<T_Result>;
}
