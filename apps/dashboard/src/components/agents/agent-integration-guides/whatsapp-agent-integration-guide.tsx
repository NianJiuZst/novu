import { ChatProviderIdEnum } from '@novu/shared';
import type { AgentIntegrationLink, AgentResponse } from '@/api/agents';
import { AgentIntegrationGuideLayout } from './agent-integration-guide-layout';
import { AgentIntegrationGuideSection } from './agent-integration-guide-section';
import { AgentIntegrationGuideStep } from './agent-integration-guide-step';

type WhatsAppAgentIntegrationGuideProps = {
  onBack: () => void;
  embedded?: boolean;
  agent: AgentResponse;
  integrationLink?: AgentIntegrationLink;
  canRemoveIntegration: boolean;
  onRequestRemoveIntegration?: () => void;
  isRemovingIntegration?: boolean;
};

export function WhatsAppAgentIntegrationGuide({
  onBack,
  embedded = false,
  agent,
  integrationLink,
  canRemoveIntegration,
  onRequestRemoveIntegration,
  isRemovingIntegration,
}: WhatsAppAgentIntegrationGuideProps) {

  return (
    <AgentIntegrationGuideLayout
      providerId={ChatProviderIdEnum.WhatsAppBusiness}
      providerDisplayName="WhatsApp Business"
      onBack={onBack}
      embedded={embedded}
      agent={agent}
      integrationLink={integrationLink}
      canRemoveIntegration={canRemoveIntegration}
      onRequestRemoveIntegration={onRequestRemoveIntegration}
      isRemovingIntegration={isRemovingIntegration}
    >
      <AgentIntegrationGuideSection title="Overview">
        <p>
          This agent sends and receives messages through your WhatsApp Business phone number. If you need to update
          credentials or reconfigure the webhook, follow the steps below.
        </p>
      </AgentIntegrationGuideSection>
      <div className="flex flex-col gap-3">
        <p className="text-text-strong text-label-sm font-medium">Steps</p>
        <AgentIntegrationGuideStep
          step={1}
          title="Create a Meta app and get credentials"
          description="Go to developers.facebook.com/apps, create a Business-type app, and add the WhatsApp product. Copy the Access Token and Phone Number ID from WhatsApp > API Setup, and the App Secret from App Settings > Basic. For production, generate a permanent System User Token instead of the temporary access token."
        />
        <AgentIntegrationGuideStep
          step={2}
          title="Configure the webhook"
          description="In your Meta app go to WhatsApp > Configuration. Set the Callback URL to the webhook URL shown above and the Verify Token to the same secret you entered in the credentials. Subscribe to the 'messages' webhook field so the agent receives inbound messages."
        />
        <AgentIntegrationGuideStep
          step={3}
          title="Verify the connection"
          description="Send a WhatsApp message to your business phone number and confirm the agent receives and responds."
        />
      </div>
    </AgentIntegrationGuideLayout>
  );
}
