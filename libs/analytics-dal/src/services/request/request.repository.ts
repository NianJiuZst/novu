import { Injectable } from '@nestjs/common';
import { FeatureFlagsService } from '@novu/application-generic';
import { PinoLogger } from 'nestjs-pino';
import { ClickHouseService, InsertOptions } from '../clickhouse.service';
import { LogRepository } from '../log.repository';
import { getInsertOptions } from '../shared';
import { ORDER_BY, Request, requestSchema, TABLE_NAME } from './request.schema';

const { REQUEST_LOGS_ASYNC_INSERT: asyncInsert, REQUEST_LOGS_WAIT_ASYNC_INSERT: waitForAsyncInsert } = process.env;
const REQUEST_LOG_INSERT_OPTIONS: InsertOptions = getInsertOptions(asyncInsert, waitForAsyncInsert);

@Injectable()
export class RequestLogRepository extends LogRepository<typeof requestSchema, Request> {
  override readonly table = TABLE_NAME;
  override readonly identifierPrefix = 'req_';

  constructor(
    override readonly clickhouseService: ClickHouseService,
    override readonly logger: PinoLogger,
    override readonly featureFlagsService: FeatureFlagsService
  ) {
    super(clickhouseService, logger, requestSchema, ORDER_BY, featureFlagsService);
    this.logger.setContext(this.constructor.name);
  }

  public async create(
    data: Omit<Request, 'expires_at'>,
    context: {
      organizationId?: string;
      environmentId?: string;
      userId?: string;
    }
  ): Promise<void> {
    await super.insert(data, context, REQUEST_LOG_INSERT_OPTIONS);
  }

  public async createMany(
    data: Omit<Request, 'id' | 'expires_at'>[],
    context: {
      organizationId?: string;
      environmentId?: string;
      userId?: string;
    }
  ): Promise<void> {
    await super.insertMany(data, context, REQUEST_LOG_INSERT_OPTIONS);
  }
}
