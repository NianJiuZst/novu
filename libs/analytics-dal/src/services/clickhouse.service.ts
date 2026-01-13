import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { ClickHouseClient, ClickHouseSettings, createClient, PingResult } from '@clickhouse/client';
import { Injectable, OnModuleDestroy } from '@nestjs/common';

export { ClickHouseClient };

export type InsertOptions = {
  asyncInsert?: boolean;
  waitForAsyncInsert?: boolean;
};

@Injectable()
export class ClickHouseService implements OnModuleDestroy {
  private _client: ClickHouseClient | undefined;

  private async runMigrations(database: string): Promise<void> {
    const migrationsPath = path.join(process.cwd(), 'apps/api/migrations/clickhouse-migrations');

    try {
      execSync(
        `npx clickhouse-migrations migrate ` +
          `--host=http://localhost:8123 ` +
          `--user=default ` +
          `--password= ` +
          `--db=${database} ` +
          `--migrations-home=${migrationsPath}`,
        { stdio: 'inherit' }
      );
      console.log('ClickHouse migrations completed successfully');
    } catch (error) {
      console.error('Failed to run ClickHouse migrations:', error);
    }
  }

  async init() {
    const {
      CLICK_HOUSE_URL: url,
      CLICK_HOUSE_DATABASE: database,
      CLICK_HOUSE_USER: username,
      CLICK_HOUSE_PASSWORD: password,
      CLICK_HOUSE_MAX_OPEN_CONNECTIONS: maxConnections,
      NODE_ENV: nodeEnv,
    } = process.env;

    if (!url || !database || !username || !password) {
      this._client = undefined;

      return;
    }

    if (nodeEnv === 'local' || nodeEnv === 'test') {
      await this.runMigrations(database);
    }

    this._client = createClient({
      url,
      username,
      password,
      database,
      max_open_connections: maxConnections ? parseInt(maxConnections, 10) : 10,
    });
  }

  get client(): ClickHouseClient | undefined {
    return this._client;
  }

  async onModuleDestroy() {
    if (!this._client) {
      return;
    }
    await this._client.close();
  }

  async ping(): Promise<PingResult> {
    if (!this._client) {
      return { success: false, error: new Error('Ping failed: ClickHouse client not initialized') };
    }

    const isAlive = await this._client.ping();

    return isAlive;
  }

  async query<T>({
    query,
    params,
  }: {
    query: string;
    params: Record<string, unknown>;
  }): Promise<{ data: T[]; rows: number }> {
    if (!this._client) {
      throw new Error('Query failed: ClickHouse client not initialized');
    }

    const resultSet = await this._client.query({
      query,
      query_params: params,
      format: 'JSON',
    });

    const data = (await resultSet.json()) as {
      data: T[];
      rows: number;
    };

    return data;
  }

  public async insert<T extends Record<string, unknown>>(
    table: string,
    values: T[],
    clickhouseSettings?: InsertOptions
  ) {
    if (!this._client) {
      return;
    }

    const settings: ClickHouseSettings = {};
    if (clickhouseSettings?.asyncInsert !== undefined) {
      settings.async_insert = clickhouseSettings.asyncInsert ? 1 : 0;
    }
    if (clickhouseSettings?.waitForAsyncInsert !== undefined) {
      settings.wait_for_async_insert = clickhouseSettings.waitForAsyncInsert ? 1 : 0;
    }

    await this._client.insert({
      table,
      values,
      format: 'JSONEachRow',
      clickhouse_settings: settings,
    });
  }

  public async exec({ query, params }: { query: string; params?: Record<string, unknown> }): Promise<void> {
    if (!this._client) {
      return;
    }

    await this._client.exec({
      query,
      ...(params && { query_params: params }),
    });
  }
}
