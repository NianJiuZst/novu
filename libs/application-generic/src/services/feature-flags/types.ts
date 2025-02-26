import { EnvironmentEntity, OrganizationEntity, UserEntity } from '@novu/dal';
import { FeatureFlagsKeysEnum } from '@novu/shared';

type PartialWithId<T> = Partial<T> & { _id: string };

type ContextEntities = {
  environment: PartialWithId<EnvironmentEntity>;
  organization: PartialWithId<OrganizationEntity>;
  user: PartialWithId<UserEntity>;
};

type RequireAtLeastOne<T> = { [K in keyof T]: { [P in K]: T[P] } & { [P in Exclude<keyof T, K>]?: T[P] } }[keyof T];

export type FeatureFlagContextBase = RequireAtLeastOne<ContextEntities>;

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
