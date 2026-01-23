import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { FeatureFlagsKeysEnum } from '@novu/shared';
import { PinoLogger } from 'nestjs-pino';
import { getLogLevel, loggingLevelArr } from '../../logging';
import { FeatureFlagsService } from '../feature-flags';

const LOG_CONTEXT = 'LogLevelService';
const DEFAULT_POLLING_INTERVAL_MS = 60_000; // one minute

@Injectable()
export class LogLevelService implements OnModuleInit, OnModuleDestroy {
  private pollingInterval: NodeJS.Timeout | null = null;
  private currentLogLevel: string;
  private readonly pollingIntervalMs: number;

  constructor(private featureFlagsService: FeatureFlagsService) {
    this.pollingIntervalMs = Number(process.env.LOG_LEVEL_POLLING_INTERVAL_MS) || DEFAULT_POLLING_INTERVAL_MS;
    this.currentLogLevel = getLogLevel();
  }

  async onModuleInit(): Promise<void> {
    await this.updateLogLevel();

    this.pollingInterval = setInterval(async () => {
      try {
        await this.updateLogLevel();
      } catch (error) {
        Logger.error(`Failed to update log level: ${(error as Error).message}`, (error as Error).stack, LOG_CONTEXT);
      }
    }, this.pollingIntervalMs);

    Logger.log(`Log level polling started with interval of ${this.pollingIntervalMs}ms`, LOG_CONTEXT);
  }

  onModuleDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      Logger.log('Log level polling stopped', LOG_CONTEXT);
    }
  }

  private async updateLogLevel(): Promise<void> {
    const logLevelFromFlag = await this.getLogLevelFromFeatureFlag();

    const newLogLevel = logLevelFromFlag || this.getFallbackLogLevel();

    if (!this.isValidLogLevel(newLogLevel)) {
      Logger.warn(
        `Invalid log level "${newLogLevel}". Valid levels: ${loggingLevelArr.join(', ')}. Keeping current level: ${this.currentLogLevel}`,
        LOG_CONTEXT
      );

      return;
    }

    if (newLogLevel !== this.currentLogLevel) {
      this.setLogLevel(newLogLevel);
      Logger.log(`Log level changed from "${this.currentLogLevel}" to "${newLogLevel}"`, LOG_CONTEXT);
      this.currentLogLevel = newLogLevel;
    }
  }

  private async getLogLevelFromFeatureFlag(): Promise<string | undefined> {
    try {
      const flagValue = await this.featureFlagsService.getFlag<string | undefined>({
        key: FeatureFlagsKeysEnum.LOG_LEVEL_STR,
        defaultValue: undefined,
        user: { _id: 'system' },
      });

      if (flagValue && flagValue !== 'undefined') {
        return flagValue;
      }

      return undefined;
    } catch (error) {
      Logger.warn(`Failed to get log level from feature flag: ${(error as Error).message}`, LOG_CONTEXT);

      return undefined;
    }
  }

  private getFallbackLogLevel(): string {
    return process.env.LOG_LEVEL || process.env.LOGGING_LEVEL || 'info';
  }

  private isValidLogLevel(level: string): boolean {
    return loggingLevelArr.includes(level);
  }

  private setLogLevel(level: string): void {
    if (PinoLogger.root) {
      PinoLogger.root.level = level;
    }
  }
}
