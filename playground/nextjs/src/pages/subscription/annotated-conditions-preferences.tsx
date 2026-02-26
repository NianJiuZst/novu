import type { RulesLogic, SubscriptionPreference, TopicSubscription } from '@novu/nextjs';
import { NovuProvider, Subscription } from '@novu/nextjs';
import { subscriptionDarkTheme } from '@novu/nextjs/themes';
import { useState } from 'react';
import { novuConfig } from '@/utils/config';

const topicKey = 'topic_key_13';
const identifier = `${topicKey}:project_4`;

type CompoundRule = { and: AnnotatedRule[] } | { or: AnnotatedRule[] };
type LeafRule = Record<string, unknown>;

type AnnotatedRule = {
  id?: string;
  rule: CompoundRule | LeafRule;
};

const DEFAULT_ANNOTATED_CONDITION: AnnotatedRule = {
  id: 'root',
  rule: {
    and: [
      { id: 'status-check', rule: { '==': [{ var: 'payload.status' }, 'completed'] } },
      { id: 'type-check', rule: { '==': [{ var: 'payload.type' }, 'notification'] } },
    ],
  },
};

function isCompound(rule: CompoundRule | LeafRule): rule is CompoundRule {
  return typeof rule === 'object' && rule !== null && ('and' in rule || 'or' in rule);
}

function getChildren(rule: CompoundRule): AnnotatedRule[] {
  return 'and' in rule ? rule.and : rule.or;
}

function getOperator(rule: CompoundRule): 'and' | 'or' {
  return 'and' in rule ? 'and' : 'or';
}

function updateById(node: AnnotatedRule, id: string, updater: (n: AnnotatedRule) => AnnotatedRule): AnnotatedRule {
  if (node.id === id) return updater(node);

  if (!isCompound(node.rule)) return node;

  const op = getOperator(node.rule);
  const updatedChildren = getChildren(node.rule).map((child) => updateById(child, id, updater));

  return { ...node, rule: { [op]: updatedChildren } as CompoundRule };
}

function toggleLeafOperator(node: AnnotatedRule): AnnotatedRule {
  if (isCompound(node.rule)) return node;

  const op = Object.keys(node.rule)[0];
  const TOGGLES: Record<string, string> = { '==': '!=', '!=': '==' };
  const nextOp = TOGGLES[op] ?? op;

  return { ...node, rule: { [nextOp]: node.rule[op] } };
}

function stripAnnotations(node: AnnotatedRule): RulesLogic {
  if (isCompound(node.rule)) {
    const op = getOperator(node.rule);
    const children = getChildren(node.rule).map(stripAnnotations);

    return { [op]: children } as RulesLogic;
  }

  return node.rule as RulesLogic;
}

function isLeafEnabled(rule: LeafRule): boolean {
  const op = Object.keys(rule)[0];

  return op === '==' || op === '>';
}

function formatLeafRule(rule: LeafRule): string {
  const op = Object.keys(rule)[0];
  const args = rule[op];

  if (!Array.isArray(args) || typeof args[0] !== 'object' || !('var' in args[0])) {
    return JSON.stringify(rule);
  }

  return `${(args[0] as { var: string }).var} ${op} ${JSON.stringify(args[1])}`;
}

type RuleNodeProps = {
  node: AnnotatedRule;
  isUpdating: string | null;
  onToggle: (id: string) => void;
  depth?: number;
};

function RuleNode({ node, isUpdating, onToggle, depth = 0 }: RuleNodeProps) {
  if (isCompound(node.rule)) {
    const children = getChildren(node.rule);
    const operator = getOperator(node.rule);

    return (
      <div className={depth > 0 ? 'border-l-2 border-gray-200 ml-2 pl-2' : ''}>
        {node.id && (
          <div className="px-2 py-1 flex items-center gap-1.5">
            <span className="text-xs font-mono text-gray-400">{node.id}</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${operator === 'and' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}
            >
              {operator}
            </span>
          </div>
        )}
        <div className="space-y-1">
          {children.map((child, i) => (
            <RuleNode key={child.id ?? i} node={child} isUpdating={isUpdating} onToggle={onToggle} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  const nodeId = node.id ?? '';

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50">
      <div className="flex flex-col gap-0.5 min-w-0">
        {node.id && <span className="text-xs font-mono text-gray-500">{node.id}</span>}
        <span className="text-xs text-gray-400 truncate">{formatLeafRule(node.rule)}</span>
      </div>
      <input
        type="checkbox"
        checked={isLeafEnabled(node.rule)}
        disabled={isUpdating !== null}
        onChange={() => onToggle(nodeId)}
        style={{
          width: '44px',
          height: '24px',
          cursor: isUpdating !== null ? 'not-allowed' : 'pointer',
          accentColor: '#22c55e',
          opacity: isUpdating === nodeId ? 0.5 : 1,
          flexShrink: 0,
        }}
      />
    </div>
  );
}

function AnnotatedPreferenceCard({ pref }: { pref: SubscriptionPreference }) {
  const [condition, setCondition] = useState<AnnotatedRule>(DEFAULT_ANNOTATED_CONDITION);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    const prevCondition = condition;
    const nextCondition = updateById(condition, id, toggleLeafOperator);
    setCondition(nextCondition);
    setIsUpdating(id);

    try {
      await pref.update({ value: stripAnnotations(nextCondition) });
    } catch (error) {
      setCondition(prevCondition);
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
      <div className="p-2">
        <RuleNode node={condition} isUpdating={isUpdating} onToggle={handleToggle} />
      </div>
    </div>
  );
}

export function AnnotatedConditionsPreferences({ isDark }: { isDark: boolean }) {
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
          <AnnotatedPreferenceCard key={pref.workflow?.id} pref={pref} />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h4>Annotated Conditions Preferences</h4>
      <NovuProvider {...novuConfig}>
        <Subscription
          topicKey={topicKey}
          identifier={`annotated-${identifier}`}
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
