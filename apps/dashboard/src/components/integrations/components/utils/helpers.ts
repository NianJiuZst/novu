import {
  ChatProviderIdEnum,
  ConfigConfiguration,
  CredentialsKeyEnum,
  EmailProviderIdEnum,
  IConfigCredential,
  IIntegration,
  IProviderConfig,
  SmsProviderIdEnum,
} from '@novu/shared';

export function isDemoIntegration(providerId: string) {
  return (
    providerId === EmailProviderIdEnum.Novu ||
    providerId === SmsProviderIdEnum.Novu ||
    providerId === ChatProviderIdEnum.Novu
  );
}

export function getDefaultVersion(provider: IProviderConfig): string | undefined {
  return provider.versions?.find((v) => v.isDefault)?.value;
}

export function getEffectiveApiVersionForForm(
  provider: IProviderConfig,
  storedCredentials: IIntegration['credentials'] | undefined
): string {
  const existing = storedCredentials?.apiVersion;

  if (existing !== undefined && existing !== null && String(existing) !== '') {
    return String(existing);
  }

  const legacy = provider.versions?.find((v) => v.isLegacyFallback)?.value;
  const defaultVersion = getDefaultVersion(provider);

  return legacy ?? defaultVersion ?? '';
}

export function buildInitialCredentialsForIntegrationForm(
  provider: IProviderConfig,
  providerCredentials: IConfigCredential[],
  mode: 'create' | 'update',
  integration?: IIntegration
): Record<string, string> {
  const base =
    mode === 'create'
      ? buildDefaultCredentialsFromProvider(providerCredentials)
      : ({ ...(integration?.credentials as Record<string, string>) } as Record<string, string>);

  if (!provider.versions?.length) {
    return base;
  }

  const defaultVersion = getDefaultVersion(provider);

  if (mode === 'create') {
    return {
      ...base,
      ...(defaultVersion !== undefined ? { apiVersion: defaultVersion } : {}),
    };
  }

  return {
    ...base,
    apiVersion: getEffectiveApiVersionForForm(provider, integration?.credentials),
  };
}

/**
 * Pre-fills credential fields from schema `value` when creating a new integration
 * (e.g. SendGrid region default).
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
