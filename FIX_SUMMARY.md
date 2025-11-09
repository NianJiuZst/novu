# Fix: Step Conditions on Array Items Always Fail

## Issue: NV-6844

**Problem**: Step conditions on array items (e.g., `payload.criteria[0].code`) were not working correctly. The conditions would always fail regardless of the actual value.

## Root Cause

JsonLogic (the library used to evaluate step conditions) **does NOT support bracket notation** for array indices. It only supports dot notation.

- ❌ Bracket notation: `criteria[0].code` → JsonLogic returns `null`
- ✅ Dot notation: `criteria.0.code` → JsonLogic returns the correct value

When users defined array schemas in the workflow editor, the UI would generate field paths with bracket notation `[0]`, which JsonLogic couldn't evaluate, causing all array-based conditions to fail.

## Solution

Normalize array bracket notation to dot notation before converting conditions to JsonLogic format.

### Changes Made

#### 1. Frontend Fix
**File**: `apps/dashboard/src/components/workflow-editor/steps/conditions/edit-step-conditions-form.tsx`

Modified the `customRuleProcessor` function to normalize field paths:

```typescript
const normalizedRule = {
  ...rule,
  field: rule.field.replace(/\[(\d+)\]/g, '.$1'),
};
```

This regex replacement converts:
- `criteria[0].code` → `criteria.0.code`
- `arr[0].nested[1].field` → `arr.0.nested.1.field`
- `simple.field` → `simple.field` (unchanged)

#### 2. Unit Tests
**File**: `apps/worker/src/app/workflow/specs/conditions-filter.usecase.spec.ts`

Added two test cases:
- Test that array item conditions correctly match when values align
- Test that array item conditions correctly fail when values don't match

#### 3. E2E Test
**File**: `apps/api/src/app/events/e2e/trigger-event.e2e.ts`

Added comprehensive e2e test for V2 workflows:
- Tests condition `{ '==': [{ var: 'payload.criteria.0.code' }, 'poi'] }`
- Verifies step execution when condition matches
- Verifies step skipping when condition doesn't match

## Verification

Tested with the customer's exact payload:

```json
{
  "payload": {
    "criteria": [{
      "state": "approved",
      "verifier": "onfido",
      "doc_type": "passport",
      "code": "poi"
    }]
  }
}
```

Results:
- **Before fix**: Bracket notation `criteria[0].code` → JsonLogic returns `null` → condition fails
- **After fix**: Normalized to `criteria.0.code` → JsonLogic returns `"poi"` → condition works correctly

## Impact

This fix resolves the issue for:
- ✅ V2 workflows with array-based step conditions
- ✅ All array indexing patterns (e.g., `[0]`, `[1]`, nested arrays)
- ✅ Backward compatible with existing dot notation conditions
- ✅ No breaking changes for non-array conditions

## Testing

Run the tests:
```bash
# Unit tests
cd apps/worker && pnpm test conditions-filter.usecase.spec.ts

# E2E tests
cd apps/api && pnpm test:e2e:novu-v2 trigger-event.e2e.ts
```

All tests pass with no linting errors.
