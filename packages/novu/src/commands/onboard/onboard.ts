/* eslint-disable no-console */

import { bold, cyan, green, red } from 'picocolors';
import { AnalyticService } from '../../services/analytics.service';
import { IOnboardCommandOptions } from './types';

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
        workflow,
        controls: {
          steps: {
            'inbox-onboarding': {
              subject: 'Welcome to Novu, Notification Ninja!! ⚡',
              body: '{"type":"doc","content":[{"type":"section","attrs":{"borderRadius":0,"backgroundColor":"","align":"left","borderWidth":0,"borderColor":"","paddingTop":0,"paddingRight":0,"paddingBottom":0,"paddingLeft":0,"marginTop":0,"marginRight":0,"marginBottom":0,"marginLeft":0,"showIfKey":null},"content":[{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/emails/Colored%20Header%20-%20Email%20Header.png?raw=true","alt":null,"title":null,"width":654,"height":65.4,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"spacer","attrs":{"height":"md","showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/Acme%20Company%20Logo%20(Color).png?raw=true","alt":null,"title":null,"width":144,"height":29.52,"alignment":"left","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"spacer","attrs":{"height":"md","showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/emails/usage-alert%20-%20Email%20Header.png?raw=true","alt":null,"title":null,"width":400,"height":160.19900497512438,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"spacer","attrs":{"height":"md","showIfKey":null}},{"type":"heading","attrs":{"textAlign":"center","level":2,"showIfKey":null},"content":[{"type":"text","text":"Approaching Your "},{"type":"variable","attrs":{"id":"payload.usageType","label":null,"fallback":null,"required":false}},{"type":"text","text":" Limit"}]},{"type":"spacer","attrs":{"height":"md","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Hi "},{"type":"variable","attrs":{"id":"payload.userName","label":null,"fallback":null,"required":false}},{"type":"text","marks":[{"type":"bold"}],"text":","}]},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Your "},{"type":"variable","attrs":{"id":"payload.usageType","label":null,"fallback":null,"required":false},"marks":[{"type":"bold"}]},{"type":"text","marks":[{"type":"bold"}],"text":" usage for "},{"type":"variable","attrs":{"id":"payload.teamName","label":null,"fallback":null,"required":false},"marks":[{"type":"bold"}]},{"type":"text","marks":[{"type":"bold"}],"text":" has reached "},{"type":"variable","attrs":{"id":"payload.usagePercentage","label":null,"fallback":null,"required":false},"marks":[{"type":"bold"}]},{"type":"text","marks":[{"type":"bold"}],"text":"%"},{"type":"text","text":" of your current allowance for this billing cycle ("},{"type":"variable","attrs":{"id":"payload.billingStart","label":null,"fallback":null,"required":false}},{"type":"text","marks":[{"type":"bold"}],"text":" – "},{"type":"variable","attrs":{"id":"payload.billingEnd","label":null,"fallback":null,"required":false}},{"type":"text","text":")."}]},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"If you exceed your limit before the cycle ends, we’ll automatically add an extra "},{"type":"variable","attrs":{"id":"payload.extraUsagePack","label":null,"fallback":null,"required":false}},{"type":"text","text":" for "},{"type":"variable","attrs":{"id":"payload.extraUsageCost","label":null,"fallback":null,"required":false}},{"type":"text","text":", giving you an additional "},{"type":"variable","attrs":{"id":"payload.extraUsageAmount","label":null,"fallback":null,"required":false}},{"type":"text","text":" "},{"type":"variable","attrs":{"id":"payload.usageType","label":null,"fallback":null,"required":false}},{"type":"text","text":" for this cycle."}]},{"type":"horizontalRule"},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Want more control? You can:"}]},{"type":"bulletList","content":[{"type":"listItem","attrs":{"color":""},"content":[{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"#0abd9f"}},{"type":"bold"}],"text":"Upgrade your plan"},{"type":"text","text":" to increase your allowance."}]}]},{"type":"listItem","attrs":{"color":""},"content":[{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"#0abd9f"}},{"type":"bold"}],"text":"Monitor usage"},{"type":"text","text":" in your account dashboard."}]}]},{"type":"listItem","attrs":{"color":""},"content":[{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"#0abd9f"}},{"type":"bold"}],"text":"Pause usage"},{"type":"text","text":" to prevent overages."}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}}]}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"button","attrs":{"text":"Check usage details","isTextVariable":false,"url":"","isUrlVariable":false,"alignment":"center","variant":"filled","borderRadius":"smooth","buttonColor":"#0abd9f","textColor":"#ffffff","showIfKey":null,"paddingTop":10,"paddingRight":32,"paddingBottom":10,"paddingLeft":32}},{"type":"paragraph","attrs":{"textAlign":"center","showIfKey":null},"content":[{"type":"text","text":"For more tips on optimizing your usage, visit our "},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"#0abd9f"}},{"type":"bold"}],"text":"Support Center"},{"type":"text","marks":[{"type":"bold"}],"text":"."}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(34, 45, 56)"}}],"text":"Stay productive,"},{"type":"hardBreak","marks":[{"type":"textStyle","attrs":{"color":"rgb(34, 45, 56)"}}]},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(34, 45, 56)"}}],"text":"Acme Inc."}]},{"type":"image","attrs":{"src":"https://github.com/novuhq/blog/blob/main/media-assets/yelp-footer.png?raw=true","alt":null,"title":null,"width":654,"height":65.19938650306749,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(34, 45, 56)"}}],"text":"© 2025 | Acme Inc., 350 Mission Street, San Francisco, CA 94105, U.S.A. | "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.yelp.com","target":"_blank","rel":"noopener noreferrer nofollow","class":"mly-no-underline","isUrlVariable":false}},{"type":"textStyle","attrs":{"color":"rgb(10, 189, 159)"}}],"text":"www.acme.com"}]},{"type":"spacer","attrs":{"height":"md","showIfKey":null}}]},{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/emails/Colored%20Footer%20-%20Email%20Footer.png?raw=true","alt":null,"title":null,"width":654,"height":65.4,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null}}]}',
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

const workflow: any = {
  workflowId: 'demo-inbox-onboarding',
  steps: [
    {
      stepId: 'inbox-onboarding',
      type: 'email',
      controls: {
        schema: {
          type: 'object',
          properties: { body: { type: 'string' }, subject: { type: 'string' } },
          required: [],
          additionalProperties: false,
        },
        unknownSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
      },
      outputs: {
        schema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            body: { type: 'string' },
            avatar: { type: 'string', format: 'uri' },
            primaryAction: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                redirect: {
                  type: 'object',
                  properties: {
                    url: {
                      type: 'string',
                      pattern: '^(?!mailto:)(?:(https?):\\\\/\\\\/[^\\\\s/$?.?#].[^\\\\s]*)|^(\\\\/[^\\\\s]*)$',
                    },
                    target: {
                      type: 'string',
                      enum: ['_self', '_blank', '_parent', '_top', '_unfencedTop'],
                      default: '_blank',
                    },
                  },
                  required: ['url'],
                  additionalProperties: false,
                },
              },
              required: ['label'],
              additionalProperties: false,
            },
          },
          required: ['body'],
          additionalProperties: false,
        },
        raw: {
          subject: 'Welcome to Novu, Notification Ninja!! ⚡',
          body: 'Notification superpowers activated! 🚀 Ship messages without the hassle.\\nCheck docs to get started.',
        },
      },
      results: {
        schema: {
          type: 'object',
          properties: {
            seen: { type: 'boolean' },
            read: { type: 'boolean' },
            lastSeenDate: { type: 'string', format: 'date-time', nullable: true },
            lastReadDate: { type: 'string', format: 'date-time', nullable: true },
          },
          required: ['seen', 'read', 'lastSeenDate', 'lastReadDate'],
          additionalProperties: false,
        },
      },
    },
  ],
  payload: {
    schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
      $schema: 'http://json-schema.org/draft-07/schema#',
    },
  },
  controls: {
    schema: {
      type: 'object',
      properties: { body: { type: 'string' }, subject: { type: 'string' } },
      required: [],
      additionalProperties: false,
    },
  },
};
