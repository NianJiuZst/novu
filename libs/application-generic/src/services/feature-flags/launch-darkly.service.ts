import { init, LDClient, LDMultiKindContext } from '@launchdarkly/node-server-sdk';
import { Injectable } from '@nestjs/common';
import type { FeatureFlagContext, FeatureFlagContextBase, IFeatureFlagsService } from './types';

@Injectable()
export class LaunchDarklyFeatureFlagsService implements IFeatureFlagsService {
  private static client: LDClient;
  private static isInitialized: boolean = false;
  public isEnabled: boolean;

  public async initialize(): Promise<void> {
    if (!LaunchDarklyFeatureFlagsService.isInitialized) {
      const launchDarklySdkKey = process.env.LAUNCH_DARKLY_SDK_KEY;
      if (!launchDarklySdkKey) {
        throw new Error('Missing Launch Darkly SDK key');
      }
      LaunchDarklyFeatureFlagsService.client = init(launchDarklySdkKey);
      await LaunchDarklyFeatureFlagsService.client.waitForInitialization({ timeout: 10000 });
      LaunchDarklyFeatureFlagsService.isInitialized = true;
    }
    this.isEnabled = true;
  }

  public async gracefullyShutdown(): Promise<void> {
    if (LaunchDarklyFeatureFlagsService.client && LaunchDarklyFeatureFlagsService.isInitialized) {
      await LaunchDarklyFeatureFlagsService.client.flush();
      LaunchDarklyFeatureFlagsService.client.close();
      LaunchDarklyFeatureFlagsService.isInitialized = false;
    }
  }

  async getFlag<T_Result>({
    key,
    defaultValue,
    environment,
    organization,
    user,
  }: FeatureFlagContext<T_Result>): Promise<T_Result> {
    const context = this.buildLDContext({ user, organization, environment });
    const newVar = await LaunchDarklyFeatureFlagsService.client.variation(key, context, defaultValue);

    return newVar;
  }

  private buildLDContext({ user, organization, environment }: FeatureFlagContextBase): LDMultiKindContext {
    const mappedContext: LDMultiKindContext = {
      kind: 'multi',
    };

    if (environment?._id) {
      mappedContext.environment = {
        key: environment._id,
        createdAt: environment.createdAt,
        updatedAt: environment.updatedAt,
      };
    }

    if (organization?._id) {
      mappedContext.organization = {
        key: organization._id,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
        externalId: organization.externalId,
        apiServiceLevel: organization.apiServiceLevel,
      };
    }

    if (user?._id) {
      mappedContext.user = {
        key: user._id,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        externalId: user.externalId,
      };
    }

    return mappedContext;
  }
}
