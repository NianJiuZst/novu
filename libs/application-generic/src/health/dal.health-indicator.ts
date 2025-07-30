import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import type { DalService } from '@novu/dal';
import type { IHealthIndicator } from './health-indicator.interface';

@Injectable()
export class DalServiceHealthIndicator extends HealthIndicator implements IHealthIndicator {
  private static KEY = 'db';

  constructor(private dalService: DalService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    const isHealthy = this.dalService.connection.readyState === 1;
    const result = this.getStatus(DalServiceHealthIndicator.KEY, isHealthy);

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('DAL health check failed', result);
  }
}
