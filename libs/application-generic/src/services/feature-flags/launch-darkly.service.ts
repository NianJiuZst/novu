import { init, LDClient, LDMultiKindContext } from '@launchdarkly/node-server-sdk';
import { Injectable, Logger } from '@nestjs/common';
import type { FeatureFlagContext, FeatureFlagContextBase, IFeatureFlagsService } from './types';

const LOG_CONTEXT = 'LaunchDarklyFeatureFlagsService';
const INITIALIZATION_TIMEOUT_SECONDS = 10;

@Injectable()
export class LaunchDarklyFeatureFlagsService implements IFeatureFlagsService {
  private client: LDClient;
  public isEnabled = false;

  public async initialize(): Promise<void> {
    try {
      this.client = init(process.env.LAUNCH_DARKLY_SDK_KEY as string);
      await this.client.waitForInitialization({ timeout: INITIALIZATION_TIMEOUT_SECONDS });
      this.isEnabled = true;
    } catch (error) {
      Logger.error(
        `Failed to initialize LaunchDarkly client, feature flags will use default values. SDK will retry to initialize in the next tick.`,
        (error as Error).stack || (error as Error).message,
        LOG_CONTEXT
      );
    }
  }

  public async gracefullyShutdown(): Promise<void> {
    if (this.client) {
      await this.client.flush();
      this.client.close();
    }
  }

  async getFlag<T_Result>({
    key,
    defaultValue,
    environment,
    organization,
    user,
    component,
  }: FeatureFlagContext<T_Result>): Promise<T_Result> {
    if (!this.isEnabled) {
      return defaultValue;
    }

    const context = this.buildLDContext({ user, organization, environment, component });

    return await this.client.variation(key, context, defaultValue);
  }

  private buildLDContext({ user, organization, environment, component }: FeatureFlagContextBase): LDMultiKindContext {
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

    const region = process.env.NOVU_REGION;
    if (region) {
      mappedContext.region = {
        key: region,
        awsRegion: region,
      };
    }

    if (component) {
      mappedContext.component = {
        key: component,
      };
    }

    /*
     * LaunchDarkly requires at least one context kind in multi-kind contexts
     * Add a fallback global context to prevent "A multi-kind context must contain at least one kind" error
     */
    const hasAnyContext = mappedContext.environment || mappedContext.organization || mappedContext.user;
    if (!hasAnyContext) {
      mappedContext.global = {
        key: 'global-context',
        anonymous: true,
      };
    }

    return mappedContext;
  }
}
