import { SIGNATURE_TIMESTAMP_TOLERANCE } from '../constants';
import {
  SignatureExpiredError,
  SignatureInvalidError,
  SignatureMismatchError,
  SignatureNotFoundError,
  SigningKeyNotFoundError,
} from '../errors';
import { createHmacSubtle } from './crypto.utils';

/**
 * Validate the Novu HMAC signature header against a payload.
 *
 * Header format: `<timestamp>=<timestampPayload>,<version>=<signaturePayload>`
 */
export async function validateNovuSignature(
  payload: unknown,
  hmacHeader: string | null,
  secretKey: string | undefined,
  hmacEnabled: boolean
): Promise<void> {
  if (!hmacEnabled) return;

  if (!hmacHeader) {
    throw new SignatureNotFoundError();
  }

  if (!secretKey) {
    throw new SigningKeyNotFoundError();
  }

  const [timestampPart, signaturePart] = hmacHeader.split(',');
  if (!timestampPart || !signaturePart) {
    throw new SignatureInvalidError();
  }

  const [timestamp, timestampPayload] = timestampPart.split('=');
  const [, signaturePayload] = signaturePart.split('=');

  if (Number(timestamp) < Date.now() - SIGNATURE_TIMESTAMP_TOLERANCE) {
    throw new SignatureExpiredError();
  }

  const localHash = await createHmacSubtle(secretKey, `${timestampPayload}.${JSON.stringify(payload)}`);

  if (localHash !== signaturePayload) {
    throw new SignatureMismatchError();
  }
}
