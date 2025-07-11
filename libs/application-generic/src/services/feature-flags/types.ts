import type { EnvironmentEntity, OrganizationEntity, UserEntity } from '@novu/dal';
import type { FeatureFlagsKeysEnum } from '@novu/shared';

type PartialWithId<T> = Partial<T> & { _id: string };

export type FeatureFlagContextBase =
  | {
      environment: PartialWithId<EnvironmentEntity>;
      organization?: PartialWithId<OrganizationEntity>;
      user?: PartialWithId<UserEntity>;
    }
  | {
      environment?: PartialWithId<EnvironmentEntity>;
      organization: PartialWithId<OrganizationEntity>;
      user?: PartialWithId<UserEntity>;
    }
  | {
      environment?: PartialWithId<EnvironmentEntity>;
      organization?: PartialWithId<OrganizationEntity>;
      user: PartialWithId<UserEntity>;
    };

export type FeatureFlagContext<TResult> = FeatureFlagContextBase & {
  key: FeatureFlagsKeysEnum;
  defaultValue: TResult;
};
export interface IFeatureFlagsService {
  isEnabled: boolean;

  initialize: () => Promise<void>;

  gracefullyShutdown: () => Promise<void>;

  getFlag: <TResult>(context: FeatureFlagContext<TResult>) => Promise<TResult>;
}
