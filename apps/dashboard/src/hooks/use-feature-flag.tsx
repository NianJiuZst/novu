import { FeatureFlags, FeatureFlagsKeysEnum, prepareBooleanStringFeatureFlag } from '@novu/shared';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { LAUNCH_DARKLY_CLIENT_SIDE_ID } from '../config';

function isLaunchDarklyEnabled() {
  return !!LAUNCH_DARKLY_CLIENT_SIDE_ID;
}

export const useFeatureFlag = (key: FeatureFlagsKeysEnum, defaultValue = false): boolean => {
  if (!isLaunchDarklyEnabled()) {
    const envValue =
      // Check if the feature flag is exported as an environment variable
      import.meta.env[`VITE_${key}`] ??
      // Then check process.env if process exists
      (typeof process !== 'undefined' ? process?.env?.[key] : undefined);

    return prepareBooleanStringFeatureFlag(envValue, defaultValue);
  }

  try {
    const flags = useFlags();
    return flags[key] ?? defaultValue;
  } catch (error) {
    console.error(`Error retrieving feature flag '${key}', returning default value:`, error);
    return defaultValue;
  }
};

export const useFeatureFlags = (): Partial<FeatureFlags> => {
  if (!isLaunchDarklyEnabled()) {
    return {};
  }

  try {
    const flags = useFlags();
    return flags as Partial<FeatureFlags>;
  } catch (error) {
    console.error('Error retrieving feature flags, returning empty object:', error);
    return {};
  }
};
