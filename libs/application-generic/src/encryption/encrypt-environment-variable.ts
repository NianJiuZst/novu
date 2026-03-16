import { EnvironmentVariableForTemplate } from '@novu/dal';
import { NOVU_ENCRYPTION_SUB_MASK } from '@novu/shared';

import { decryptSecret } from './encrypt-provider';

export function decryptEnvironmentVariableValue(value: string): string {
  if (value.startsWith(NOVU_ENCRYPTION_SUB_MASK)) {
    return decryptSecret(value);
  }

  return value;
}

export function resolveEnvironmentVariables(variables: EnvironmentVariableForTemplate[]): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const variable of variables) {
    resolved[variable.key] = decryptEnvironmentVariableValue(variable.value);
  }

  return resolved;
}
