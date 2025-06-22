import { createMemo, Index, Show } from 'solid-js';

import { AIPreference, ChannelPreference, Preference } from '../../../../types';
import { PreferencesListSkeleton } from './PreferencesListSkeleton';
import { PreferencesRow } from './PreferencesRow';

export const DefaultPreferences = (props: {
  workflowPreferences?: Preference[];
  loading?: boolean;
  updatePreference: (preference: Preference) => (channels: ChannelPreference) => void;
  updateAIPreference?: (preference: Preference) => (aiPreference: AIPreference) => void;
}) => {
  const workflowPreferences = createMemo(() => props.workflowPreferences);

  const updatePreference = (workflowIdentifier?: string) => (channels: ChannelPreference) => {
    const preference = workflowPreferences()?.find((pref) => pref.workflow?.identifier === workflowIdentifier);
    if (!preference) return;

    props.updatePreference(preference)(channels);
  };

  const updateAIPreference = (workflowIdentifier?: string) => (aiPreference: AIPreference) => {
    const preference = workflowPreferences()?.find((pref) => pref.workflow?.identifier === workflowIdentifier);
    if (!preference || !props.updateAIPreference) return;

    props.updateAIPreference(preference)(aiPreference);
  };

  return (
    <Show when={workflowPreferences()?.length} fallback={<PreferencesListSkeleton loading={props.loading} />}>
      <Index each={workflowPreferences()}>
        {(preference) => {
          return (
            <PreferencesRow
              iconKey="routeFill"
              preference={preference()}
              onChange={updatePreference}
              onAIPreferenceChange={props.updateAIPreference ? updateAIPreference : undefined}
            />
          );
        }}
      </Index>
    </Show>
  );
};
