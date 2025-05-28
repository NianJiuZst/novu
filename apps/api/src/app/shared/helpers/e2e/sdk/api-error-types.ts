/*
 * Re-export error types from @novu/api
 * This works around the ESM/CommonJS interop issue
 */
export type { ErrorDto, SDKValidationError, ValidationErrorDto } from '@novu/api/esm/models/errors';

// Import the actual implementations
const errors = require('@novu/api/esm/models/errors');

export const isErrorDto = (error: unknown): error is typeof errors.ErrorDto => {
  return (
    error instanceof errors.ErrorDto ||
    (typeof error === 'object' && error !== null && 'name' in error && error.name === 'ErrorDto')
  );
};

export const isValidationErrorDto = (error: unknown): error is typeof errors.ValidationErrorDto => {
  return (
    error instanceof errors.ValidationErrorDto ||
    (typeof error === 'object' && error !== null && 'name' in error && error.name === 'ValidationErrorDto')
  );
};

export const isSDKValidationError = (error: unknown): error is typeof errors.SDKValidationError => {
  return (
    error instanceof errors.SDKValidationError ||
    (typeof error === 'object' && error !== null && 'name' in error && error.name === 'SDKValidationError')
  );
};
