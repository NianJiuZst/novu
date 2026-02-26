# AnnotatedRule Conditions Preferences

This document explains why `AnnotatedRule` is a better structure than raw `RulesLogic` for building conditions-based subscription preference UIs.

## The Problem with Raw `RulesLogic`

The original `conditions-preferences.tsx` component manages conditions using raw `RulesLogic` objects and a parallel `CONDITION_RULES` array. This creates several DX problems:

### 1. Fragile rule identification via `JSON.stringify`

To check which rules are currently "active", the component compares serialized JSON:

```typescript
const isEnabled = rules.some(
  (r) => JSON.stringify(r) === JSON.stringify(condRule.enabledRule)
);
```

This breaks silently if key order changes between serializations, and it cannot distinguish between two rules that produce the same JSON output.

### 2. Redundant dual definitions

Every rule must be defined twice — once for the "enabled" case and once for the "disabled" case:

```typescript
{
  key: 'status',
  label: 'payload.status',
  enabledRule:  { '==': [{ var: 'payload.status' }, 'completed'] },
  disabledRule: { '!=': [{ var: 'payload.status' }, 'completed'] },
}
```

Adding a new condition means touching three places: the `CONDITION_RULES` array, the `buildConditionFromStates` helper, and potentially the render logic.

### 3. Full tree rebuild on every toggle

Toggling any single rule rebuilds the entire condition tree from scratch:

```typescript
function buildConditionFromStates(states: Record<string, boolean>): RulesLogic {
  const rules = CONDITION_RULES.map((r) => (states[r.key] ? r.enabledRule : r.disabledRule));
  return buildCondition({ operator: 'and', rules });
}
```

This means the component cannot perform targeted updates — changing one leaf always regenerates the entire root.

### 4. Flat-only structure

The component can only handle a single flat list of rules under one `and`/`or` operator. Rendering nested groups (e.g. `and [ or [...], and [...] ]`) requires a complete rewrite of the state management and render logic.

### 5. Unsafe type casts

Without IDs, parsing the condition tree requires multiple unsafe casts:

```typescript
const raw = condition as Record<string, RulesLogic[]>;
const operator = Object.keys(raw)[0] as ConditionOperator;
```

---

## The Solution: `AnnotatedRule`

`AnnotatedRule` wraps each node in the rule tree with a stable `id`:

```typescript
type AnnotatedRule =
  | { id?: string; rule: { and: AnnotatedRule[] } }
  | { id?: string; rule: { or: AnnotatedRule[] } }
  | { id?: string; rule: LeafRule };
```

A conditions tree now looks like:

```typescript
const condition: AnnotatedRule = {
  id: 'root',
  rule: {
    and: [
      { id: 'status-check', rule: { '==': [{ var: 'payload.status' }, 'completed'] } },
      { id: 'type-check',   rule: { '==': [{ var: 'payload.type' },   'notification'] } },
    ],
  },
};
```

---

## Side-by-Side Comparison

| Operation | Raw `RulesLogic` | `AnnotatedRule` |
|---|---|---|
| Find a rule | `JSON.stringify` comparison across every node | `findById(tree, id)` — O(n) recursive lookup by stable ID |
| Update a rule | Rebuild the entire tree from a parallel `ruleStates` record | `updateById(tree, id, updater)` — targeted immutable update |
| Toggle a rule | Look up in `CONDITION_RULES`, replace with `enabledRule`/`disabledRule` | `toggleLeafOperator(node)` — flip operator on the node directly |
| Render nested groups | Not supported without a rewrite | Recursive `RuleNode` component handles any depth naturally |
| Add a new rule | Edit `CONDITION_RULES`, `buildConditionFromStates`, and render | Add one entry to the annotated tree |
| Type safety | Requires `as` casts to parse operator and args | Tree structure is self-describing; helpers are strongly typed |

---

## Before and After

### Before — adding a third condition

```typescript
// 1. Add to CONDITION_RULES
const CONDITION_RULES = [
  // ...existing two rules...
  {
    key: 'priority',
    label: 'payload.priority',
    enabledRule:  { '==': [{ var: 'payload.priority' }, 'high'] },
    disabledRule: { '!=': [{ var: 'payload.priority' }, 'high'] },
  },
];

// 2. buildConditionFromStates picks it up automatically — but only if key matches
// 3. getRuleStatesFromCondition must also handle it correctly
// 4. formatRuleLabel must parse the new op without error
```

### After — adding a third condition

```typescript
const condition: AnnotatedRule = {
  id: 'root',
  rule: {
    and: [
      { id: 'status-check',   rule: { '==': [{ var: 'payload.status' },   'completed'] } },
      { id: 'type-check',     rule: { '==': [{ var: 'payload.type' },     'notification'] } },
      { id: 'priority-check', rule: { '==': [{ var: 'payload.priority' }, 'high'] } },
    ],
  },
};
```

One change, one place.

---

## Sending to the API

The SDK's `SubscriptionPreference.update()` currently accepts `RulesLogic`. Strip annotations before sending:

```typescript
function stripAnnotations(node: AnnotatedRule): RulesLogic {
  if (isCompound(node)) {
    const operator = getGroupOperator(node);
    const children = getChildRules(node).map(stripAnnotations);
    return { [operator]: children } as RulesLogic;
  }
  return node.rule as RulesLogic;
}

await pref.update({ value: stripAnnotations(annotatedCondition) });
```

Once the SDK exposes `AnnotatedRule` natively via `SubscriptionPreference.update({ value: AnnotatedRule })`, the `stripAnnotations` step can be removed entirely.

---

## Files

| File | Description |
|---|---|
| `conditions-preferences.tsx` | Original implementation using raw `RulesLogic` |
| `annotated-conditions-preferences.tsx` | New implementation using `AnnotatedRule` |
