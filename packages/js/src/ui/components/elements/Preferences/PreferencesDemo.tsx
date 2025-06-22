import { createSignal } from 'solid-js';
import { AIPreference, ChannelPreference, PreferenceLevel } from '../../../../types';
import { Preference } from '../../../../preferences/preference';
import { PreferencesRow } from './PreferencesRow';
import { useStyle } from '../../../helpers';

export const PreferencesDemo = () => {
  const style = useStyle();

  // Mock preference data
  const [mockPreference, setMockPreference] = createSignal<Preference>(
    new Preference(
      {
        level: PreferenceLevel.TEMPLATE,
        enabled: true,
        channels: {
          email: true,
          in_app: true,
          push: false,
          sms: false,
          chat: true,
        },
        workflow: {
          id: 'demo-workflow-1',
          identifier: 'user-signup-welcome',
          name: 'User Signup Welcome',
          critical: false,
          tags: ['onboarding', 'welcome'],
        },
        aiPreference: {
          enabled: false,
          prompt: '',
        },
      },
      {
        emitterInstance: {} as any,
        inboxServiceInstance: {} as any,
        cache: {} as any,
        useCache: false,
      }
    )
  );

  const handleChannelChange = (workflowIdentifier?: string) => (channels: ChannelPreference) => {
    console.log('Channel preferences updated:', channels);
    // In a real app, this would update the preference via API
    const current = mockPreference();
    setMockPreference(
      new Preference(
        {
          ...current,
          channels: { ...current.channels, ...channels },
        },
        {
          emitterInstance: {} as any,
          inboxServiceInstance: {} as any,
          cache: {} as any,
          useCache: false,
        }
      )
    );
  };

  const handleAIPreferenceChange = (workflowIdentifier?: string) => (aiPreference: AIPreference) => {
    console.log('AI preference updated:', aiPreference);
    // In a real app, this would update the preference via API
    const current = mockPreference();
    setMockPreference(
      new Preference(
        {
          ...current,
          aiPreference,
        },
        {
          emitterInstance: {} as any,
          inboxServiceInstance: {} as any,
          cache: {} as any,
          useCache: false,
        }
      )
    );
  };

  return (
    <div class={style('preferencesDemo', 'nt-p-4 nt-max-w-md nt-mx-auto nt-space-y-4')}>
      <h2 class={style('preferencesDemoTitle', 'nt-text-lg nt-font-bold nt-text-foreground nt-mb-4')}>
        AI Preferences Demo
      </h2>

      <PreferencesRow
        iconKey="routeFill"
        preference={mockPreference()}
        onChange={handleChannelChange}
        onAIPreferenceChange={handleAIPreferenceChange}
      />

      <div class={style('preferencesDemoInfo', 'nt-mt-4 nt-p-3 nt-bg-neutral-alpha-50 nt-rounded-lg nt-text-sm')}>
        <h3 class={style('preferencesDemoInfoTitle', 'nt-font-semibold nt-mb-2')}>How it works:</h3>
        <ul class={style('preferencesDemoInfoList', 'nt-space-y-1 nt-text-foreground-alpha-600')}>
          <li>• Toggle channel preferences as usual</li>
          <li>• Enable AI preference to let AI decide when to notify you</li>
          <li>• Write a custom prompt describing your notification preferences</li>
          <li>• AI will analyze notification content against your prompt</li>
        </ul>
      </div>
    </div>
  );
};
