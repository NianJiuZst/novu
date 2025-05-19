class ErrorContext {
  timestamp: string;
  service: string;
  environment: string;
  traceId?: string;
}

export function parseErrorInformation(
  error: unknown,
  context?: Partial<ErrorContext>
): {
  level: string;
  message: string;
  error: Record<string, any>;
  context?: ErrorContext;
} {
  try {
    // Prepare default context
    const defaultContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME || 'unknown-service',
      environment: process.env.NODE_ENV || 'unknown-env',
    };

    // Merge provided context with default
    const fullContext = { ...defaultContext, ...context };

    // Handle Error objects
    if (error instanceof Error) {
      const errorDetails: Record<string, any> = {
        message: error.message,
        name: error.name,
        type: 'Error',
        // Optional additional properties
        ...('cause' in error && error.cause && typeof error.cause === 'object' ? { cause: error.cause } : {}),
        ...((error as any).code ? { code: (error as any).code } : {}),
        ...((error as any).details ? { details: (error as any).details } : {}),
        stack: error.stack?.split('\n').slice(0, 5),
      };

      return {
        level: 'error',
        message: `Error in ${fullContext.service}: ${error.message}`,
        error: errorDetails,
        context: fullContext,
      };
    }
  } catch (formatingError) {
    // Fallback in case of formatting error
    return {
      level: 'critical',
      message: 'Critical error in error formatting',
      error: {
        type: 'format_error',

        details: String(formatingError),
      },
      context: {
        timestamp: new Date().toISOString(),
        service: 'error-formatter',
        environment: '',
      },
    };
  }

  // Fallback for non-Error objects or other unhandled cases
  return {
    level: 'error',
    message: 'An unknown error occurred',
    error: {
      type: 'unknown_error',
      details: String(error),
    },
    context: {
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME || 'unknown-service',
      environment: process.env.NODE_ENV || 'unknown-env',
      ...(context || {}),
    },
  };
}
