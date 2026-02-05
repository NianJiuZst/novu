export type EmailStepConfig = {
  template: string;
  workflowId: string;
  subject?: string;
};

export type NovuConfig = {
  outDir?: string;
  steps: {
    email: Record<string, EmailStepConfig>;
  };
  apiUrl?: string;
  aliases?: Record<string, string>;
};

export function validateConfig(config: unknown): NovuConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid config: must be an object');
  }

  const novuConfig = config as Partial<NovuConfig>;

  if (!novuConfig.steps || typeof novuConfig.steps !== 'object') {
    throw new Error('Invalid config: steps field is required and must be an object');
  }

  if (!novuConfig.steps.email || typeof novuConfig.steps.email !== 'object') {
    throw new Error('Invalid config: steps.email field is required and must be an object');
  }

  const errors: string[] = [];
  const stepIds = new Set<string>();

  for (const [stepId, emailConfig] of Object.entries(novuConfig.steps.email)) {
    if (stepIds.has(stepId)) {
      errors.push(`Duplicate step ID: ${stepId}`);
    }
    stepIds.add(stepId);

    if (!emailConfig.template || typeof emailConfig.template !== 'string') {
      errors.push(`steps.email['${stepId}'].template is required and must be a string`);
    }

    if (!emailConfig.workflowId || typeof emailConfig.workflowId !== 'string') {
      errors.push(`steps.email['${stepId}'].workflowId is required and must be a string`);
    }

    if (emailConfig.subject !== undefined && typeof emailConfig.subject !== 'string') {
      errors.push(`steps.email['${stepId}'].subject must be a string`);
    }
  }

  if (novuConfig.outDir !== undefined && typeof novuConfig.outDir !== 'string') {
    errors.push('outDir must be a string');
  }

  if (novuConfig.apiUrl !== undefined && typeof novuConfig.apiUrl !== 'string') {
    errors.push('apiUrl must be a string');
  }

  if (novuConfig.aliases !== undefined && typeof novuConfig.aliases !== 'object') {
    errors.push('aliases must be an object');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation errors:\n  • ${errors.join('\n  • ')}`);
  }

  return novuConfig as NovuConfig;
}
