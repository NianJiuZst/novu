import { Injectable } from '@nestjs/common';
import type { FeatureFlagContext, IFeatureFlagsService } from './types';

@Injectable()
export class ProcessEnvFeatureFlagsService implements IFeatureFlagsService {
  public isEnabled: boolean = true;

  async initialize() {
    this.isEnabled = true;
  }
  async gracefullyShutdown() {
    this.isEnabled = false;
  }

  async getFlag<TResult>(context: FeatureFlagContext<TResult>): Promise<TResult> {
    const processEnvValue = process.env[context.key];
    if (!processEnvValue) {
      return context.defaultValue as TResult;
    }

    if (typeof context.defaultValue === 'number') {
      return Number(processEnvValue) as TResult;
    }

    if (typeof context.defaultValue === 'boolean') {
      return (processEnvValue === 'true') as TResult;
    }
  }
}
