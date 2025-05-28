/*
 * Re-export HTTPClient types from @novu/api
 * This works around the ESM/CommonJS interop issue
 */
export type { HTTPClientOptions } from '@novu/api/esm/lib/http';

// Import the actual implementation
const httpModule = require('@novu/api/esm/lib/http');

// Re-export the HTTPClient class
export const { HTTPClient } = httpModule;
export type HTTPClient = typeof httpModule.HTTPClient;
