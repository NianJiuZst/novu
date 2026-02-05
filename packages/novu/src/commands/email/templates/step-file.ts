import type { EmailStepConfig } from '../config/schema';

export function generateStepFile(templateImportPath: string, emailConfig: EmailStepConfig): string {
  const defaultSubject = emailConfig.subject || 'No Subject';

  return `import { render } from '@react-email/components';
import EmailTemplate from '${templateImportPath}';

export default async function({ payload, subscriber, context, steps }) {
  return {
    subject: payload.subject || '${defaultSubject}',
    body: await render(
      <EmailTemplate
        {...payload}
        subscriber={subscriber}
        context={context}
        steps={steps}
      />
    ),
  };
}
`;
}
