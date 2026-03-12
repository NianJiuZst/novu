type EmailStepConfig = {
  template: string;
  subject?: string;
};

function escapeString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function humanizeStepId(stepId: string): string {
  return stepId
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function generateStepFile(stepId: string, templateImportPath: string, emailConfig: EmailStepConfig): string {
  const defaultSubject = emailConfig.subject || humanizeStepId(stepId);

  return `import { step } from '@novu/framework/step-resolver';
import { render } from '@react-email/components';
import { z } from 'zod';
import EmailTemplate from '${escapeString(templateImportPath)}';

// Controls are editable in the Novu dashboard by non-technical users.
// Add more fields here to make your email content dynamic.
// Docs: https://docs.novu.co/framework/controls
const controlSchema = z.object({
  subject: z.string().default('${escapeString(defaultSubject)}'),
});

export default step.email(
  '${escapeString(stepId)}',
  async (controls, { payload, subscriber }) => ({
    subject: controls.subject,
    body: await render(
      <EmailTemplate
        {...controls}
        {...payload}
        subscriber={subscriber}
      />
    ),
  }),
  { controlSchema }
);
`;
}
