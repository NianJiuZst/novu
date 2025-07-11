import { Inject } from '@nestjs/common';
import { CacheService, type CachingConfig } from '../cache.service';

type CachedEntityOptions<TOutput, TArgs extends any[]> = CachingConfig & {
  skipCache?: (...args: TArgs) => boolean;
  skipSaveToCache?: (response: TOutput) => boolean;
};

export function CachedResponse<TOutput = any, TArgs extends any[] = any[]>({
  builder,
  options,
}: {
  builder: (...args: TArgs) => string;
  options?: CachedEntityOptions<TOutput, TArgs>;
}) {
  const injectCache = Inject(CacheService);

  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as (...args: TArgs) => Promise<TOutput>;
    const methodName = key;
    injectCache(target, 'cacheService');

    // eslint-disable-next-line no-param-reassign
    descriptor.value = async function (this: any, ...args: TArgs): Promise<TOutput> {
      const cacheService = this.cacheService as CacheService;

      // Check if cache is disabled
      if (!cacheService?.cacheEnabled()) {
        return await originalMethod.apply(this, args);
      }

      // Check if we should skip caching based on input arguments
      if (options?.skipCache && options.skipCache(...args)) {
        return await originalMethod.apply(this, args);
      }

      const cacheKey = builder(...args);
      if (!cacheKey) {
        return await originalMethod.apply(this, args);
      }

      try {
        const value = await cacheService.get(cacheKey);

        if (value) {
          const parsedValue = parseValueFromCache(value);

          return parsedValue as TOutput;
        }
      } catch (err) {
        // Silently handle cache retrieval error
      }

      const response: TOutput = await originalMethod.apply(this, args);

      try {
        if (!options?.skipSaveToCache?.(response)) {
          const valueToCache = isPrimitive(response) ? String(response) : JSON.stringify(response);
          await cacheService.set(cacheKey, valueToCache, options);
        }

        return response;
      } catch {
        // Silently handle cache insertion error
        return response;
      }
    };

    return descriptor;
  };
}

function parseValueFromCache(value: string): unknown {
  if (value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;

  const numValue = Number(value);
  if (!Number.isNaN(numValue)) return numValue;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isPrimitive(value: unknown): boolean {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
