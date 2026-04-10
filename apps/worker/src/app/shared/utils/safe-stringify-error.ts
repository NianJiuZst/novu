/**
 * Safely stringify an error object, handling circular references that
 * commonly occur in provider/Axios errors (TLSSocket, Socket, etc.).
 */
export function safeStringifyError(error: any): string {
  try {
    return JSON.stringify(error);
  } catch {
    try {
      const safe: Record<string, unknown> = {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        status: error?.status ?? error?.statusCode,
      };
      if (error?.response?.data) {
        safe.responseData = error.response.data;
      }
      if (error?.response?.status) {
        safe.responseStatus = error.response.status;
      }

      return JSON.stringify(safe);
    } catch {
      return error?.message || String(error);
    }
  }
}

/**
 * Extract a human-readable message from an error that may carry a
 * JSON-encoded message (e.g. from webhook filter failures) or a plain string.
 */
export function safeExtractErrorMessage(error: any): string {
  const raw = error?.message ?? String(error ?? '');
  try {
    const parsed = JSON.parse(raw);

    return parsed?.message ?? raw;
  } catch {
    return raw;
  }
}
