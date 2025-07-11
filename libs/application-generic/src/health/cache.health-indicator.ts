import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import type { CacheService } from '../services/cache';

@Injectable()
export class CacheServiceHealthIndicator extends HealthIndicator {
  private static KEY = 'cacheService';

  constructor(private cacheService: CacheService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    const isHealthy = this.cacheService.cacheEnabled();
    const result = this.getStatus(CacheServiceHealthIndicator.KEY, isHealthy);

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('Cache health check failed', result);
  }
}
