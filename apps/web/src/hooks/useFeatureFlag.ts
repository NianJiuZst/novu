import { useFlags } from 'launchdarkly-react-client-sdk';
import { FeatureFlagsKeysEnum, prepareBooleanStringFeatureFlag } from '@novu/shared';
import { LAUNCH_DARKLY_CLIENT_SIDE_ID } from '../config';

function isLaunchDarklyEnabled() {
  return !!LAUNCH_DARKLY_CLIENT_SIDE_ID;
}

export const useFeatureFlag = (key: FeatureFlagsKeysEnum, defaultValue = false): boolean => {
  if (!isLaunchDarklyEnabled()) {
    return prepareBooleanStringFeatureFlag(window._env_[key] || process.env[key], defaultValue);
  }

  try {
    const flags = useFlags();
    return flags[key] ?? defaultValue;
  } catch (error) {
    console.error(`Error retrieving feature flag '${key}', returning default value:`, error);
    return defaultValue;
  }
};
