import { createEffect, createResource, createSignal, onCleanup, onMount } from 'solid-js';
import { Preference } from '../../../preferences/preference';
import { FetchPreferencesArgs } from '../../../preferences/types';
import { useNovu } from '../../context';

export const usePreferences = (options?: FetchPreferencesArgs) => {
  const novu = useNovu();

  const [loading, setLoading] = createSignal(true);
  const [preferences, { mutate, refetch }] = createResource(options || {}, async ({ tags }) => {
    try {
      const response = await novu.preferences.list({ tags });

      return response.data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
  });

  onMount(() => {
    const listener = ({ data }: { data: Preference[] }) => {
      if (!data) {
        return;
      }

      mutate(data);
    };

    const singlePreferenceListener = ({ data }: { data?: Preference }) => {
      if (!data) {
        return;
      }

      // Update the specific preference in the list
      const currentPreferences = preferences();
      if (currentPreferences) {
        const updatedPreferences = currentPreferences.map((pref) => {
          // For global preferences, match by level
          if (data.level === 'global' && pref.level === 'global') {
            return data;
          }
          // For workflow preferences, match by workflow ID
          if (data.workflow?.id && pref.workflow?.id === data.workflow.id) {
            return data;
          }

          return pref;
        });
        mutate(updatedPreferences);
      }
    };

    const listCleanup = novu.on('preferences.list.updated', listener);
    const updateCleanup = novu.on('preference.update.resolved', singlePreferenceListener);
    const pendingCleanup = novu.on('preference.update.pending', singlePreferenceListener);

    onCleanup(() => {
      listCleanup();
      updateCleanup();
      pendingCleanup();
    });
  });

  createEffect(() => {
    setLoading(preferences.loading);
  });

  return { preferences, loading, mutate, refetch };
};
