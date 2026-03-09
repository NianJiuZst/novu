import * as Sentry from '@sentry/react';
import { NovuApiError } from '@/api/api.client';
import { CheckIntegrationResponseEnum } from '@/api/integrations';
import { showErrorToast } from '../../../../components/primitives/sonner-helpers';

function extractValidationMessages(error: unknown): string[] | null {
  if (!(error instanceof NovuApiError) || !error.rawError) return null;

  const raw = error.rawError as Record<string, unknown>;
  const errors = raw.errors as Record<string, { messages?: string[] }> | undefined;
  if (!errors) return null;

  const messages: string[] = [];
  for (const group of Object.values(errors)) {
    if (Array.isArray(group?.messages)) {
      messages.push(
        ...group.messages.map((msg) =>
          msg.replace(/^credentials\./, '').replace(/^configurations\./, '')
        )
      );
    }
  }

  return messages.length > 0 ? messages : null;
}

function extractErrorCode(error: unknown): string | undefined {
  if (!(error instanceof NovuApiError) || !error.rawError) return undefined;

  const raw = error.rawError as Record<string, unknown>;

  return (raw.code as string) ?? undefined;
}

export function handleIntegrationError(error: unknown, operation: 'update' | 'create' | 'delete') {
  const code = extractErrorCode(error);

  if (code === CheckIntegrationResponseEnum.INVALID_EMAIL) {
    showErrorToast((error as NovuApiError).message, 'Invalid sender email');

    return;
  }

  if (code === CheckIntegrationResponseEnum.BAD_CREDENTIALS) {
    showErrorToast((error as NovuApiError).message, 'Invalid credentials or credentials expired');

    return;
  }

  const validationMessages = extractValidationMessages(error);
  if (validationMessages) {
    showErrorToast(validationMessages.join(', '), `Failed to ${operation} integration`);

    return;
  }

  Sentry.captureException(error);

  const message =
    error instanceof Error ? error.message : `There was an error ${operation}ing the integration.`;
  showErrorToast(message, `Failed to ${operation} integration`);
}
