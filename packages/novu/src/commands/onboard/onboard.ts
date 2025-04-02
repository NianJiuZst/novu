/* eslint-disable no-console */

import { bold, cyan, green, red } from 'picocolors';
import { IOnboardCommandOptions } from './types';
import { AnalyticService } from '../../services/analytics.service';

const analytics = new AnalyticService();

export async function onboardCommand(options: IOnboardCommandOptions, anonymousId?: string): Promise<void> {
  const { subscriberId, apiKey, apiUrl = 'https://api.novu.co' } = options;

  if (anonymousId) {
    analytics.track({
      identity: {
        anonymousId,
      },
      data: {
        subscriberId,
      },
      event: 'Run Novu Onboard Command',
    });
  }

  console.log(`\n${bold('Sending onboarding notification to your inbox...')}\n`);

  try {
    const stepId = 'inbox-onboarding';

    // Send the onboarding trigger to the user's inbox
    const response = await fetch(`${apiUrl}/v1/events/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ApiKey ${apiKey}`,
      },
      body: JSON.stringify({
        name: 'onboarding-notification',
        to: {
          subscriberId,
        },
        workflow: JSON.parse(workflow),
        controls: {
          steps: {
            [stepId]: {
              subject: 'Welcome to Novu, Notification Ninja!! ⚡',
              body: 'Notification superpowers activated! Ship messages without the hassle. Check docs to get started.',
            },
          },
        },
        payload: {
          __source: 'cli',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send onboarding notification');
    }

    const data = await response.json();

    console.log(`${green('✓')} ${cyan('Onboarding notification sent successfully!')}`);
    console.log(`${green('✓')} ${cyan('Transaction ID:')} ${data.data.transactionId || 'N/A'}\n`);
    console.log(`${bold('Next steps:')}`);
    console.log(`  1. ${cyan('Check your inbox')} to see the notification`);
    console.log(`  2. ${cyan('Create a workflow of your own in the Dashboard')} in the Novu dashboard`);
    console.log(`  3. ${cyan('Trigger your first notification')} from your application\n`);
    console.log(`${bold('Documentation:')} ${cyan('https://docs.novu.co')}\n`);
  } catch (error) {
    console.error(`${red('✗')} ${red('Failed to send onboarding notification:')}`);
    console.error(`  ${red(error.message || 'Unknown error')}\n`);
    console.log(`${bold('Troubleshooting:')}`);
    console.log(`  1. ${cyan('Verify your API key')} in the Novu dashboard`);
    console.log(`  2. ${cyan('Ensure the subscriber matches')} in inbox and trigger`);
    console.log(`${bold('Documentation:')} ${cyan('https://docs.novu.co')}\n`);

    process.exit(1);
  }
}

const workflow =
  // eslint-disable-next-line max-len
  '{"workflowId":"demo-inbox-onboarding","steps":[{"stepId":"inbox-onboarding","type":"in_app","controls":{"schema":{"type":"object","properties":{"body":{"type":"string"},"subject":{"type":"string"}},"required":[],"additionalProperties":false},"unknownSchema":{"type":"object","properties":{},"required":[],"additionalProperties":false}},"outputs":{"schema":{"type":"object","properties":{"subject":{"type":"string"},"body":{"type":"string"},"avatar":{"type":"string","format":"uri"},"primaryAction":{"type":"object","properties":{"label":{"type":"string"},"redirect":{"type":"object","properties":{"url":{"type":"string","pattern":"^(?!mailto:)(?:(https?):\\\\/\\\\/[^\\\\s/$?.?#].[^\\\\s]*)|^(\\\\/[^\\\\s]*)$"},"target":{"type":"string","enum":["_self","_blank","_parent","_top","_unfencedTop"],"default":"_blank"}},"required":["url"],"additionalProperties":false}},"required":["label"],"additionalProperties":false}},"required":["body"],"additionalProperties":false},"raw":{"subject":"Welcome to Novu, Notification Ninja!! ⚡","body":"Notification superpowers activated! 🚀 Ship messages without the hassle.\\nCheck docs to get started."}},"results":{"schema":{"type":"object","properties":{"seen":{"type":"boolean"},"read":{"type":"boolean"},"lastSeenDate":{"type":"string","format":"date-time","nullable":true},"lastReadDate":{"type":"string","format":"date-time","nullable":true}},"required":["seen","read","lastSeenDate","lastReadDate"],"additionalProperties":false}}}],"payload":{"schema":{"type":"object","properties":{},"additionalProperties":false,"$schema":"http://json-schema.org/draft-07/schema#"}},"controls":{"schema":{"type":"object","properties":{"body":{"type":"string"},"subject":{"type":"string"}},"required":[],"additionalProperties":false}}}';
