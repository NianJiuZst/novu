# AnnotatedRule — Developer Guide

`AnnotatedRule` is a lightweight wrapper that adds a stable `id` to any rule in a `RulesLogic<ExtendedOperations>` tree. This guide explains the problem it solves and how to use it.

---

## The Problem

Working with raw `RulesLogic<ExtendedOperations>` trees in UI code requires identifying nodes without any stable handle. The typical workaround is serializing the rule to JSON and comparing strings:

```typescript
const isActive = rules.some(
  (r) => JSON.stringify(r) === JSON.stringify(targetRule)
);
```

This breaks silently when JSON key order differs, and makes targeted updates impossible — any change to a single leaf forces you to rebuild the entire tree.

---

## The Solution

Wrap each node with an `id`:

```typescript
type AnnotatedRule = {
  id?: string;
  rule: RulesLogic<ExtendedOperations> | { and: AnnotatedRule[] } | { or: AnnotatedRule[] };
};
```

The same condition tree now looks like this:

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

## Before and After

### Finding a rule

**Before**
```typescript
const active = rules.some(
  (r) => JSON.stringify(r) === JSON.stringify(targetRule)
);
```

**After**
```typescript
function findById(node: AnnotatedRule, id: string): AnnotatedRule | null {
  if (node.id === id) return node;
  if ('and' in node.rule) return node.rule.and.reduce<AnnotatedRule | null>((acc, child) => acc ?? findById(child, id), null);
  if ('or'  in node.rule) return node.rule.or.reduce<AnnotatedRule | null>((acc, child) => acc ?? findById(child, id), null);
  return null;
}

const node = findById(condition, 'status-check');
```

### Updating a rule

**Before** — rebuild the entire tree from a parallel state record:
```typescript
const rules = CONDITION_RULES.map((r) =>
  states[r.key] ? r.enabledRule : r.disabledRule
);
const newCondition = { and: rules };
```

**After** — targeted immutable update by ID:
```typescript
function updateById(
  node: AnnotatedRule,
  id: string,
  updater: (n: AnnotatedRule) => AnnotatedRule
): AnnotatedRule {
  if (node.id === id) return updater(node);
  if ('and' in node.rule) return { ...node, rule: { and: node.rule.and.map((c) => updateById(c, id, updater)) } };
  if ('or'  in node.rule) return { ...node, rule: { or:  node.rule.or.map((c)  => updateById(c, id, updater)) } };
  return node;
}

const updated = updateById(condition, 'status-check', (n) => ({
  ...n,
  rule: { '!=': [{ var: 'payload.status' }, 'completed'] },
}));
```

### Adding a new rule

**Before** — edit the parallel config array, the builder function, and the render logic:
```typescript
const CONDITION_RULES = [
  { key: 'status', enabledRule: { '==' : [...] }, disabledRule: { '!=' : [...] } },
  { key: 'type',   enabledRule: { '==' : [...] }, disabledRule: { '!=' : [...] } },
  // Add here AND update buildConditionFromStates AND update render
  { key: 'priority', enabledRule: { '==' : [...] }, disabledRule: { '!=' : [...] } },
];
```

**After** — one entry, one place:
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

---

## Sending to the API

`SubscriptionPreference.update()` accepts `RulesLogic<ExtendedOperations>`. Strip the annotations before sending:

```typescript
function stripAnnotations(node: AnnotatedRule): RulesLogic<ExtendedOperations> {
  if ('and' in node.rule) return { and: node.rule.and.map(stripAnnotations) } as RulesLogic<ExtendedOperations>;
  if ('or'  in node.rule) return { or:  node.rule.or.map(stripAnnotations)  } as RulesLogic<ExtendedOperations>;
  return node.rule as RulesLogic<ExtendedOperations>;
}

await preference.update({ value: stripAnnotations(condition) });
```
