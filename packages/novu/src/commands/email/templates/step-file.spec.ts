import { describe, expect, it } from 'vitest';
import type { EmailStepConfig } from '../config/schema';
import { generateStepFile } from './step-file';

describe('generateStepFile', () => {
  const baseConfig: EmailStepConfig = {
    template: 'emails/welcome.tsx',
    workflowId: 'onboarding',
  };

  it('should generate correct import path', () => {
    const result = generateStepFile('../emails/welcome', baseConfig);

    expect(result).toContain("import EmailTemplate from '../emails/welcome';");
  });

  it('should use config.subject when provided', () => {
    const config: EmailStepConfig = {
      ...baseConfig,
      subject: 'Welcome to Acme!',
    };

    const result = generateStepFile('../emails/welcome', config);

    expect(result).toContain("subject: payload.subject || 'Welcome to Acme!'");
  });

  it('should fallback to No Subject when no subject provided', () => {
    const result = generateStepFile('../emails/welcome', baseConfig);

    expect(result).toContain("subject: payload.subject || 'No Subject'");
  });

  it('should include all context parameters', () => {
    const result = generateStepFile('../emails/welcome', baseConfig);

    expect(result).toContain('payload, subscriber, context, steps');
    expect(result).toContain('{...payload}');
    expect(result).toContain('subscriber={subscriber}');
    expect(result).toContain('context={context}');
    expect(result).toContain('steps={steps}');
  });

  it('should generate valid TypeScript/JSX syntax', () => {
    const result = generateStepFile('../emails/welcome', baseConfig);

    expect(result).toContain("import { render } from '@react-email/components';");
    expect(result).toContain('export default async function');
    expect(result).toContain('return {');
    expect(result).toContain('subject:');
    expect(result).toContain('body:');
    expect(result).toContain('await render(');
    expect(result).toContain('<EmailTemplate');
  });

  it('should handle relative import paths correctly', () => {
    const result1 = generateStepFile('./emails/welcome', baseConfig);
    expect(result1).toContain("import EmailTemplate from './emails/welcome';");

    const result2 = generateStepFile('../../src/emails/welcome', baseConfig);
    expect(result2).toContain("import EmailTemplate from '../../src/emails/welcome';");
  });
});
