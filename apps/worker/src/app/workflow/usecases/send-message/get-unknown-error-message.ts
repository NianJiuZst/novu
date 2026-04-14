export function getUnknownErrorMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value !== null && typeof value === 'object' && 'message' in value) {
    const message = (value as { message: unknown }).message;

    if (typeof message === 'string') {
      return message;
    }
  }

  return String(value);
}

export function getUnknownErrorName(value: unknown): string | undefined {
  if (value instanceof Error) {
    return value.name;
  }

  if (value !== null && typeof value === 'object' && 'name' in value) {
    const name = (value as { name: unknown }).name;

    if (typeof name === 'string') {
      return name;
    }
  }

  return undefined;
}
