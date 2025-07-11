import { ChannelTypeEnum, EmailProviderIdEnum } from '@novu/shared';
import { IS_SELF_HOSTED } from '../config';
import { useIntegrations } from './integrations';

export function useOnboardingExperiment() {
  const { integrations, loading: areIntegrationsLoading } = useIntegrations();

  const emailIntegrationOtherThanNovu = integrations?.find(
    (integration) =>
      integration.channel === ChannelTypeEnum.EMAIL && integration.providerId !== EmailProviderIdEnum.Novu
  );

  return {
    isOnboardingExperimentEnabled: !areIntegrationsLoading && !emailIntegrationOtherThanNovu && !IS_SELF_HOSTED,
  };
}
