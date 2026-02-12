export enum InMemoryLRUCacheStore {
  WORKFLOW = 'workflow',
  ORGANIZATION = 'organization',
  ENVIRONMENT = 'environment',
  API_KEY_USER = 'api-key-user',
  VALIDATOR = 'validator',
}

export type StoreConfig = {
  max: number;
  ttl: number;
  featureFlagComponent: string;
  skipFeatureFlag?: boolean;
};

export const STORE_CONFIGS: Record<InMemoryLRUCacheStore, StoreConfig> = {
  [InMemoryLRUCacheStore.WORKFLOW]: {
    max: 1000,
    ttl: 1000 * 30,
    featureFlagComponent: 'workflow',
  },
  [InMemoryLRUCacheStore.ORGANIZATION]: {
    max: 500,
    ttl: 1000 * 60,
    featureFlagComponent: 'organization',
  },
  [InMemoryLRUCacheStore.ENVIRONMENT]: {
    max: 500,
    ttl: 1000 * 60,
    featureFlagComponent: 'environment',
  },
  [InMemoryLRUCacheStore.API_KEY_USER]: {
    max: 1000,
    ttl: 1000 * 60,
    featureFlagComponent: 'api-key-user',
  },
  [InMemoryLRUCacheStore.VALIDATOR]: {
    max: 5000,
    ttl: 1000 * 60 * 60,
    featureFlagComponent: 'validator',
    skipFeatureFlag: true,
  },
};
