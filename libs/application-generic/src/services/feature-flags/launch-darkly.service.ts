import {
	init,
	LDClient,
	LDMultiKindContext,
} from "@launchdarkly/node-server-sdk";
import { Injectable, Logger } from "@nestjs/common";
import type {
	FeatureFlagContext,
	FeatureFlagContextBase,
	IFeatureFlagsService,
} from "./types";

const LOG_CONTEXT = "LaunchDarklyFeatureFlagsService";

@Injectable()
export class LaunchDarklyFeatureFlagsService implements IFeatureFlagsService {
	private client: LDClient;
	public isEnabled = false;

	public async initialize(): Promise<void> {
		const launchDarklySdkKey = process.env.LAUNCH_DARKLY_SDK_KEY;
		if (!launchDarklySdkKey) {
			throw new Error("Missing Launch Darkly SDK key");
		}

		try {
			this.client = init(launchDarklySdkKey);
			await this.client.waitForInitialization({ timeout: 10000 });
			this.isEnabled = true;
			Logger.log("LaunchDarkly client initialized successfully", LOG_CONTEXT);
		} catch (error) {
			Logger.error(
				"Failed to initialize LaunchDarkly client",
				(error as Error).stack || (error as Error).message,
				LOG_CONTEXT,
			);
			this.isEnabled = false;
			throw error;
		}
	}

	public async gracefullyShutdown(): Promise<void> {
		if (this.client) {
			try {
				await this.client.flush();
				this.client.close();
				Logger.log("LaunchDarkly client shut down successfully", LOG_CONTEXT);
			} catch (error) {
				Logger.error(
					"Error during LaunchDarkly client shutdown",
					(error as Error).stack || (error as Error).message,
					LOG_CONTEXT,
				);
			}
		}
	}

	async getFlag<T_Result>({
		key,
		defaultValue,
		environment,
		organization,
		user,
	}: FeatureFlagContext<T_Result>): Promise<T_Result> {
		// Return default value if client is not initialized
		if (!this.client || !this.isEnabled) {
			Logger.warn(
				`LaunchDarkly client not initialized, returning default value for flag: ${key}`,
				LOG_CONTEXT,
			);
			return defaultValue;
		}

		try {
			const context = this.buildLDContext({ user, organization, environment });
			const result = await this.client.variation(key, context, defaultValue);
			return result;
		} catch (error) {
			Logger.error(
				`Error retrieving feature flag '${key}', returning default value`,
				(error as Error).stack || (error as Error).message,
				LOG_CONTEXT,
			);
			return defaultValue;
		}
	}

	private buildLDContext({
		user,
		organization,
		environment,
	}: FeatureFlagContextBase): LDMultiKindContext {
		const mappedContext: LDMultiKindContext = {
			kind: "multi",
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

		/*
		 * LaunchDarkly requires at least one context kind in multi-kind contexts
		 * Add a fallback global context to prevent "A multi-kind context must contain at least one kind" error
		 */
		const hasAnyContext =
			mappedContext.environment ||
			mappedContext.organization ||
			mappedContext.user;
		if (!hasAnyContext) {
			mappedContext.global = {
				key: "global-context",
				anonymous: true,
			};
		}

		return mappedContext;
	}
}
