import path from 'node:path';
import { getEnvFileNameForNodeEnv } from '@novu/shared';
import dotenv from 'dotenv';

/**
 * Loads the same .env file as bootstrap (`env.config.ts`) for Mocha unit tests.
 * E2E uses `e2e/setup.ts` → `bootstrap()` which imports `env.config`; unit specs
 * import Nest modules directly and must load env before `SharedModule` connects Mongo.
 */
dotenv.config({ path: path.join(__dirname, '..', getEnvFileNameForNodeEnv(process.env.NODE_ENV)) });
