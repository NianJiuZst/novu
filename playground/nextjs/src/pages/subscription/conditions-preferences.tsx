import type { RulesLogic, SubscriptionPreference, TopicSubscription } from '@novu/nextjs';
import { NovuProvider, Subscription } from '@novu/nextjs';
import { subscriptionDarkTheme } from '@novu/nextjs/themes';
import { useState } from 'react';
import { novuConfig } from '@/utils/config';

const topicKey = 'topic_key_13';
const identifier = `${topicKey}:project_4`;

type ConditionOperator = 'and' | 'or';

type CompoundCondition = {
  operator: ConditionOperator;
  rules: RulesLogic[];
};

type ConditionRule = {
  key: string;
  label: string;
  enabledRule: RulesLogic;
  disabledRule: RulesLogic;
};

const CONDITION_RULES: ConditionRule[] = [
  {
    key: 'status',
    label: 'payload.status',
    enabledRule: { '==': [{ var: 'payload.status' }, 'completed'] },
    disabledRule: { '!=': [{ var: 'payload.status' }, 'completed'] },
  },
  {
    key: 'type',
    label: 'payload.type',
    enabledRule: { '==': [{ var: 'payload.type' }, 'notification'] },
    disabledRule: { '!=': [{ var: 'payload.type' }, 'notification'] },
  },
];

function buildCondition({ operator, rules }: CompoundCondition): RulesLogic {
  return { [operator]: rules } as RulesLogic;
}

function getRuleStatesFromCondition(condition: RulesLogic | undefined): Record<string, boolean> {
  const defaults = Object.fromEntries(CONDITION_RULES.map((r) => [r.key, false]));

  if (!condition) return defaults;

  const raw = condition as Record<string, RulesLogic[]>;
  const operator = Object.keys(raw)[0] as ConditionOperator;
  const rules = raw[operator];

  if (!Array.isArray(rules)) return defaults;

  return Object.fromEntries(
    CONDITION_RULES.map((condRule) => {
      const isEnabled = rules.some((r) => JSON.stringify(r) === JSON.stringify(condRule.enabledRule));

      return [condRule.key, isEnabled];
    })
  );
}

function buildConditionFromStates(states: Record<string, boolean>): RulesLogic {
  const rules = CONDITION_RULES.map((r) => (states[r.key] ? r.enabledRule : r.disabledRule));

  return buildCondition({ operator: 'and', rules });
}

function formatRuleLabel(rule: RulesLogic): string {
  const ruleObj = rule as Record<string, [{ var: string }, string]>;
  const op = Object.keys(ruleObj)[0];
  const [{ var: field }, value] = ruleObj[op];

  return `${field} ${op} ${value}`;
}

function PreferenceConditionRows({ pref }: { pref: SubscriptionPreference }) {
  const [ruleStates, setRuleStates] = useState<Record<string, boolean>>(() =>
    getRuleStatesFromCondition(pref.condition)
  );
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleToggleRule = async (ruleKey: string, checked: boolean) => {
    const nextStates = { ...ruleStates, [ruleKey]: checked };
    setRuleStates(nextStates);
    setIsUpdating(ruleKey);

    try {
      const newCondition = buildConditionFromStates(nextStates);
      await pref.update({ value: newCondition });
    } catch (error) {
      setRuleStates(ruleStates);
      console.error('Failed to update preference:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b">
        <span className="text-sm font-semibold">{pref.workflow?.name || 'Workflow'}</span>
      </div>
      {CONDITION_RULES.map((rule, index) => (
        <div
          key={rule.key}
          className={`flex items-center justify-between px-3 py-2 ${index < CONDITION_RULES.length - 1 ? 'border-b' : ''}`}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-gray-700">{rule.label}</span>
            <span className="text-xs text-gray-400">
              {formatRuleLabel(ruleStates[rule.key] ? rule.enabledRule : rule.disabledRule)}
            </span>
          </div>
          <input
            type="checkbox"
            checked={ruleStates[rule.key]}
            disabled={isUpdating !== null}
            onChange={(e) => handleToggleRule(rule.key, e.target.checked)}
            style={{
              width: '44px',
              height: '24px',
              cursor: isUpdating !== null ? 'not-allowed' : 'pointer',
              accentColor: '#22c55e',
              opacity: isUpdating === rule.key ? 0.5 : 1,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function ConditionsPreferences({ isDark }: { isDark: boolean }) {
  const renderPreferences = (subscription?: TopicSubscription, loading?: boolean) => {
    if (loading) {
      return <div className="p-4 text-center">Loading...</div>;
    }

    if (!subscription) {
      return <div className="p-4 text-center text-gray-500">No subscription</div>;
    }

    return (
      <div className="p-4 space-y-3">
        {subscription.preferences?.map((pref: SubscriptionPreference) => (
          <PreferenceConditionRows key={pref.workflow?.id} pref={pref} />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h4>Conditions Preferences</h4>
      <NovuProvider {...novuConfig}>
        <Subscription
          topicKey={topicKey}
          identifier={`conditions-${identifier}`}
          preferences={[{ workflowId: 'yolo' }]}
          renderPreferences={renderPreferences}
          appearance={{
            baseTheme: isDark ? subscriptionDarkTheme : undefined,
          }}
        />
      </NovuProvider>
    </div>
  );
}
