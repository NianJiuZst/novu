import { createMemo, createSignal, Show } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';

import { AIPreference, ChannelPreference } from '../../../../types';
import { StringLocalizationKey, useLocalization } from '../../../context';
import { cn, useStyle } from '../../../helpers';
import { Sparkle } from '../../../icons';
import { AppearanceKey } from '../../../types';
import { Collapsible } from '../../primitives/Collapsible';
import { Switch, SwitchState } from '../../primitives/Switch';
import { Textarea } from '../../primitives/Textarea';

export const AIPreferenceRow = (props: {
  aiPreference?: AIPreference;
  workflowName?: string;
  workflowIdentifier?: string;
  onChange: (aiPreference: AIPreference) => void;
}) => {
  const style = useStyle();
  const { t } = useLocalization();
  const [isExpanded, setIsExpanded] = createSignal(false);

  const aiEnabled = createMemo(() => {
    return props.aiPreference?.enabled ?? false;
  });
  const aiPrompt = createMemo(() => props.aiPreference?.prompt ?? '');

  const handleToggleAI = (newState: SwitchState) => {
    const newEnabled = newState === 'enabled';
    const aiPreferenceUpdate = {
      enabled: newEnabled,
      prompt: aiPrompt(),
    };
    props.onChange(aiPreferenceUpdate);
    if (newEnabled && !isExpanded()) {
      setIsExpanded(true);
    }
  };

  const handlePromptChange = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    props.onChange({
      enabled: aiEnabled(),
      prompt: target.value,
    });
  };

  const iconClass = style('aiPreferenceIcon', 'nt-text-primary nt-size-4', {
    iconKey: 'sparkle',
  });

  return (
    <Show when={true}>
      <div
        class={style(
          'aiPreferenceContainer',
          'nt-p-3 nt-bg-gradient-to-r nt-from-primary-alpha-50 nt-to-secondary-alpha-50 nt-rounded-lg nt-border nt-border-primary-alpha-100'
        )}
      >
        <div class={style('aiPreferenceHeader', 'nt-flex nt-justify-between nt-items-start nt-gap-3')}>
          <div class={style('aiPreferenceLabelContainer', 'nt-flex nt-items-start nt-gap-2 nt-flex-1')}>
            <div class={style('aiPreferenceIconContainer', 'nt-mt-0.5')}>
              <Sparkle class={iconClass} />
            </div>
            <div class={style('aiPreferenceContent', 'nt-flex-1')}>
              <div class={style('aiPreferenceTitle', 'nt-flex nt-items-center nt-gap-2 nt-mb-1')}>
                <span class={style('aiPreferenceLabel', 'nt-text-sm nt-font-semibold nt-text-foreground')}>
                  AI Preference
                </span>
                <span
                  class={style(
                    'aiPreferenceBadge',
                    'nt-px-2 nt-py-0.5 nt-text-xs nt-bg-primary-alpha-100 nt-text-primary nt-rounded-full nt-font-medium'
                  )}
                >
                  Beta
                </span>
              </div>
              <p class={style('aiPreferenceDescription', 'nt-text-xs nt-text-foreground-alpha-600 nt-leading-relaxed')}>
                Let AI decide when to send you notifications based on your custom prompt
              </p>
            </div>
          </div>
          <div class={style('aiPreferenceSwitchContainer', 'nt-flex nt-items-center nt-gap-2')}>
            <Switch state={aiEnabled() ? 'enabled' : 'disabled'} onChange={handleToggleAI} />
          </div>
        </div>

        <Collapsible open={aiEnabled()}>
          <div class={style('aiPreferencePromptContainer', 'nt-mt-3 nt-pt-3 nt-border-t nt-border-primary-alpha-100')}>
            <label
              class={style('aiPreferencePromptLabel', 'nt-block nt-text-xs nt-font-medium nt-text-foreground nt-mb-2')}
            >
              AI Prompt
            </label>
            <Textarea
              value={aiPrompt()}
              onInput={handlePromptChange}
              placeholder="Describe when you want to receive notifications for this workflow. For example: 'Only notify me about high-priority issues during business hours' or 'Send notifications only if the message mentions my name or team'"
              size="sm"
              class={style(
                'aiPreferencePromptInput',
                'nt-w-full nt-text-xs nt-bg-background nt-border-primary-alpha-200'
              )}
            />
            <p class={style('aiPreferencePromptHint', 'nt-text-xs nt-text-foreground-alpha-500 nt-mt-1')}>
              Be specific about your preferences. The AI will analyze notification content against your prompt.
            </p>
          </div>
        </Collapsible>
      </div>
    </Show>
  );
};
