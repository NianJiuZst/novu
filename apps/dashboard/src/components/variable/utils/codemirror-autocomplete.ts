import { getFilters } from '@/components/variable/constants';
import type { LiquidVariable } from '@/components/variable/parseStepVariables';

import { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { EditorView } from '@uiw/react-codemirror';
import { FIXED_NAMESPACES_WITH_UNKNOWN_KEYS, DYNAMIC_NAMESPACES_WITH_UNKNOWN_KEYS_REGEX } from '../constants';

interface CompletionOption {
  label: string;
  type: string;
  boost?: number;
}

/**
 * Liquid variable autocomplete for the following patterns:
 *
 * 1. Payload Variables:
 *    Valid:
 *    - payload.userId
 *    - payload.anyNewField (allows any new field)
 *    - payload.deeply.nested.field
 *    Invalid:
 *    - pay (shows suggestions but won't validate)
 *    - payload (shows suggestions but won't validate)
 *
 * 2. Subscriber Variables:
 *    Valid:
 *    - subscriber.data.
 *    - subscriber.data.anyNewField (allows any new field)
 *    - subscriber.data.custom.nested.field
 *    - subscriber (shows suggestions but won't validate)
 *    - subscriber.email
 *    - subscriber.firstName
 *    Invalid:
 *    - subscriber.someOtherField (must use valid subscriber field)
 *
 * 3. Step Variables:
 *    Valid:
 *    - steps.
 *    - steps.digest-step (must be existing step ID)
 *    - steps.digest-step.events
 *    - steps.digest-step.events[0]
 *    - steps.digest-step.events[0].id
 *    - steps.digest-step.events[0].payload
 *    - steps.digest-step.events[0].payload.anyNewField (allows any new field after payload)
 *    - steps.digest-step.events[0].payload.deeply.nested.field
 *    Invalid:
 *    - steps.invalid-step (must use existing step ID)
 *    - steps.digest-step.payload (must use events[n].payload pattern)
 *    - steps.digest-step.events.payload (must use events[n] pattern)
 *    - steps.digest-step.invalidProp (only events[] is allowed)
 *
 * Autocomplete Behavior:
 * 1. Shows suggestions when typing partial prefixes:
 *    - 'su' -> shows subscriber.data.* variables
 *    - 'pay' -> shows payload.* variables
 *    - 'ste' -> shows steps.* variables
 *
 * 2. Shows suggestions with closing braces:
 *    - '{{su}}' -> shows subscriber.data.* variables
 *    - '{{payload.}}' -> shows payload.* variables
 *
 * 3. Allows new variables after valid prefixes:
 *    - subscriber.data.* (any new field)
 *    - payload.* (any new field)
 *    - steps.{valid-step}.events[n].payload.* (any new field)
 */
export const completions =
  (variables: LiquidVariable[], isEnhancedDigestEnabled: boolean) =>
  (context: CompletionContext): CompletionResult | null => {
    const { state, pos } = context;
    const beforeCursor = state.sliceDoc(0, pos);

    // Only proceed if we're inside or just after {{
    const lastOpenBrace = beforeCursor.lastIndexOf('{{');
    if (lastOpenBrace === -1) return null;

    // Get the content between {{ and cursor
    const insideBraces = state.sliceDoc(lastOpenBrace + 2, pos);

    // Get clean search text without braces and trim
    const searchText = insideBraces.replace(/}+$/, '').trim();

    // Handle pipe filters
    const afterPipe = getContentAfterPipe(searchText);

    if (afterPipe !== null) {
      return {
        from: pos - afterPipe.length,
        to: pos,
        options: getFilterCompletions(afterPipe, isEnhancedDigestEnabled),
      };
    }

    const matchingVariables = getVariableCompletions(searchText, variables);

    const options = matchingVariables.map((v) => createCompletionOption(v.label, 'variable'));

    // If we have matches or we're in a valid context, show them
    if (matchingVariables.length > 0 || isInsideLiquidBlock(beforeCursor)) {
      return {
        from: lastOpenBrace + 2,
        to: pos,
        options,
      };
    }

    return null;
  };

function isInsideLiquidBlock(beforeCursor: string): boolean {
  return beforeCursor.lastIndexOf('{{') !== -1;
}

function getContentAfterPipe(content: string): string | null {
  const pipeIndex = content.lastIndexOf('|');
  if (pipeIndex === -1) return null;

  return content.slice(pipeIndex + 1).trimStart();
}

function createCompletionOption(label: string, type: string, boost?: number): CompletionOption {
  return { label, type, ...(boost && { boost }) };
}

function getFilterCompletions(afterPipe: string, isEnhancedDigestEnabled: boolean): CompletionOption[] {
  return getFilters(isEnhancedDigestEnabled)
    .filter((f) => f.label.toLowerCase().startsWith(afterPipe.toLowerCase()))
    .map((f) => createCompletionOption(f.value, 'function'));
}

function getVariableCompletions(searchText: string, variables: LiquidVariable[]): LiquidVariable[] {
  if (!searchText) return variables;

  const searchLower = searchText.toLowerCase();

  const dynamicNamespacesWithUnknownKeys = variables.reduce<string[]>((acc, entry) => {
    const match = entry.label.match(DYNAMIC_NAMESPACES_WITH_UNKNOWN_KEYS_REGEX);

    if (match) {
      acc.push(`${match[0]}.payload`);
    }

    return acc;
  }, []);

  const dynamicVariables = [...FIXED_NAMESPACES_WITH_UNKNOWN_KEYS, ...dynamicNamespacesWithUnknownKeys].reduce<
    LiquidVariable[]
  >((acc, namespace) => {
    if (searchText.startsWith(namespace) && searchText !== namespace) {
      // Ensure that if the user types payload.foo the first suggestion is payload.foo
      acc.push({ label: searchText, type: 'variable' });
    } else if (!searchText.startsWith(namespace)) {
      // For all other values, suggest payload.whatever, subscriber.data.whatever
      acc.push({
        label: `${namespace}.${searchLower.trim()}`,
        type: 'variable',
      });
    }

    return acc;
  }, []);

  const uniqueVariables = Array.from(
    new Map([...variables, ...dynamicVariables].map((item) => [item.label, item])).values()
  );

  return uniqueVariables.filter((v) => v.label.toLowerCase().includes(searchLower));
}

export function createAutocompleteSource(variables: LiquidVariable[], isEnhancedDigestEnabled: boolean) {
  return (context: CompletionContext) => {
    // Match text that starts with {{ and capture everything after it until the cursor position
    const word = context.matchBefore(/\{\{([^}]*)/);
    if (!word) return null;

    const options = completions(variables, isEnhancedDigestEnabled)(context);
    if (!options) return null;

    const { from, to } = options;

    return {
      from,
      to,
      options: options.options.map((option) => ({
        ...option,
        apply: (view: EditorView, completion: Completion, from: number, to: number) => {
          const selectedValue = completion.label;
          const content = view.state.doc.toString();
          const beforeCursor = content.slice(0, from);
          const afterCursor = content.slice(to);

          // Ensure proper {{ }} wrapping
          const needsOpening = !beforeCursor.endsWith('{{');
          const needsClosing = !afterCursor.startsWith('}}');

          const wrappedValue = `${needsOpening ? '{{' : ''}${selectedValue}${needsClosing ? '}}' : ''}`;

          // Calculate the final cursor position
          // Add 2 if we need to account for closing brackets
          const finalCursorPos = from + wrappedValue.length + (needsClosing ? 0 : 2);

          view.dispatch({
            changes: { from, to, insert: wrappedValue },
            selection: { anchor: finalCursorPos },
          });

          return true;
        },
      })),
    };
  };
}
