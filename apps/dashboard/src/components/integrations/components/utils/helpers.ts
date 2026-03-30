import {
  ChatProviderIdEnum,
  ConfigConfiguration,
  CredentialsKeyEnum,
  EmailProviderIdEnum,
  IConfigCredential,
  SmsProviderIdEnum,
} from '@novu/shared';

export function isDemoIntegration(providerId: string) {
  return (
    providerId === EmailProviderIdEnum.Novu ||
    providerId === SmsProviderIdEnum.Novu ||
    providerId === ChatProviderIdEnum.Novu
  );
}

/**
 * Pre-fills credential fields from schema `value` when creating a new integration
 * (e.g. SES API v2, SendGrid region default).
 */
export function buildDefaultCredentialsFromProvider(credentials: IConfigCredential[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const c of credentials) {
    if (c.value === undefined || c.value === null) {
      continue;
    }

    if (typeof c.value === 'boolean') {
      result[c.key] = c.value ? 'true' : 'false';

      continue;
    }

    if (typeof c.value === 'number') {
      result[c.key] = String(c.value);

      continue;
    }

    if (typeof c.value === 'string' && c.value === '') {
      continue;
    }

    result[c.key] = String(c.value);
  }

  return result;
}

export function configurationToCredential(config: ConfigConfiguration): IConfigCredential {
  return {
    key: config.key as CredentialsKeyEnum,
    value: config.value,
    placeholder: config.placeholder,
    dropdown: config.dropdown,
    displayName: config.displayName,
    description: config.description,
    type: config.type,
    required: config.required,
    links: config.links,
    tooltip: {
      text: config.tooltip,
    },
  } as IConfigCredential;
}

const OBJECT_CREDENTIAL_KEYS = new Set<string>([CredentialsKeyEnum.TlsOptions]);

export function cleanCredentials(credentials: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(credentials)) {
    if (value === '' || value === undefined || value === null) continue;

    if (OBJECT_CREDENTIAL_KEYS.has(key) && typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && parsed !== null) {
          cleaned[key] = parsed;
          continue;
        }
      } catch {
        // leave as string, API validation will catch it
      }
    }

    cleaned[key] = value;
  }

  return cleaned;
}
