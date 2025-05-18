import { useCallback } from 'react';
import { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { EditorView } from '@uiw/react-codemirror';

import { LiquidVariable } from '@/utils/parseStepVariables';
import { usePayloadSchema } from '@/context/payload-schema';
import { getFilters } from '@/components/variable/constants';

// Moved from liquid-autocomplete.ts
interface OriginalCompletionOption {
  label: string;
  type: string;
  boost?: number;
  info?: Completion['info'];
  displayLabel?: Completion['displayLabel'];
}

const PAYLOAD_NAMESPACE = 'payload';
const SUBSCRIBER_DATA_NAMESPACE = 'subscriber.data';
const STEP_PAYLOAD_REGEX = /^steps\\\\.[a-zA-Z0-9_-]+\\\\.events/;

function isInsideLiquidBlock(beforeCursor: string): boolean {
  const lastOpenBrace = beforeCursor.lastIndexOf('{{');

  return lastOpenBrace !== -1;
}

function getContentAfterPipe(content: string): string | null {
  const pipeIndex = content.lastIndexOf('|');
  if (pipeIndex === -1) return null;

  return content.slice(pipeIndex + 1).trimStart();
}

function createOriginalCompletionOption(
  label: string,
  type: string,
  boost?: number,
  info?: Completion['info'],
  displayLabel?: Completion['displayLabel']
): OriginalCompletionOption {
  return { label, type, ...(boost && { boost }), ...(info && { info }), ...(displayLabel && { displayLabel }) };
}

function getFilterCompletions(afterPipe: string): OriginalCompletionOption[] {
  return getFilters()
    .filter((f) => f.label.toLowerCase().startsWith(afterPipe.toLowerCase()))
    .map((f) => createOriginalCompletionOption(f.value, 'function'));
}

function getMatchingVariables(searchText: string, variables: LiquidVariable[]): LiquidVariable[] {
  if (!searchText) return variables;

  const searchTextTrimmed = searchText.trim();

  if (searchText.endsWith('.')) {
    const prefix = searchText.slice(0, -1);
    return variables.filter((v) => v.name.startsWith(prefix));
  }

  const stepPayloadNamespaces = variables.reduce<string[]>((acc, variableItem) => {
    const match = variableItem.name.match(STEP_PAYLOAD_REGEX);
    const withPayload = match ? `${match[0]}.payload` : null;

    if (withPayload && !acc.includes(withPayload)) {
      acc.push(withPayload);
    }

    return acc;
  }, []);

  const jitVariables = [PAYLOAD_NAMESPACE, SUBSCRIBER_DATA_NAMESPACE, ...stepPayloadNamespaces].reduce<
    LiquidVariable[]
  >((acc, namespace) => {
    if (searchText.startsWith('steps.')) {
      return acc;
    }

    if (searchText.startsWith(namespace) && searchText !== namespace) {
      acc.push({ name: searchText, type: 'variable' });
    } else if (!searchText.startsWith(namespace)) {
      acc.push({
        name: `${namespace}.${searchText.trim()}`,
        type: 'variable',
      });
    }

    return acc;
  }, []);

  const uniqueVariables = Array.from(
    new Map([...jitVariables, ...variables].map((item) => [item.name, item])).values()
  );

  return uniqueVariables.filter((v) => {
    const namePartWithoutFilters = v.name.split('|')[0].trim();
    return namePartWithoutFilters.includes(searchTextTrimmed);
  });
}

// Original completions function, might need to be adapted or its signature changed
const completionsInternal =
  (variables: LiquidVariable[]) =>
  (context: CompletionContext): CompletionResult | null => {
    const { state, pos } = context;
    const beforeCursor = state.sliceDoc(0, pos);
    const lastOpenBrace = beforeCursor.lastIndexOf('{{');
    if (lastOpenBrace === -1) return null;

    const insideBraces = state.sliceDoc(lastOpenBrace + 2, pos);
    const searchText = insideBraces.replace(/}+$/, '').trim();
    const afterPipe = getContentAfterPipe(searchText);

    if (afterPipe !== null) {
      return {
        from: pos - afterPipe.length,
        to: pos,
        options: getFilterCompletions(afterPipe),
      };
    }

    const matchingVariables = getMatchingVariables(searchText, variables);

    if (matchingVariables.length > 0 || isInsideLiquidBlock(beforeCursor)) {
      return {
        from: lastOpenBrace + 2, // Start from after {{
        to: pos, // End at the cursor position
        options:
          matchingVariables.length > 0
            ? matchingVariables.map((v) =>
                createOriginalCompletionOption(v.name, v.type ?? 'variable', v.boost, v.info, v.displayLabel)
              )
            : variables.map(
                (
                  v // Fallback if no specific matches but inside {{ }}
                ) => createOriginalCompletionOption(v.name, v.type ?? 'variable', v.boost, v.info, v.displayLabel)
              ),
      };
    }

    return null;
  };

const ADD_NEW_VARIABLE_TYPE = 'add-new-variable';

export function useAutocompleteSource(
  schemaVariables: LiquidVariable[],
  isVariableInPayloadSchema: (variableName: string) => boolean,
  onVariableSelect?: (completion: Completion) => void
) {
  const { addPendingVariable, isPendingVariable } = usePayloadSchema();

  const autocompleteSource = useCallback(
    (context: CompletionContext): CompletionResult | null => {
      const word = context.matchBefore(/\{\{\s*([^}]*)$/);

      if (!word) {
        return null;
      }

      const typedTextClean = word.text.trim();

      const baseCompletionResult = completionsInternal(schemaVariables)(context);
      let options: Completion[] = baseCompletionResult?.options ? [...baseCompletionResult.options] : [];
      const completionFrom = baseCompletionResult?.from ?? word.from + 2;
      const completionTo = baseCompletionResult?.to ?? word.to;

      if (typedTextClean.length > 0 && !/\s/.test(typedTextClean)) {
        const isAlreadyInSchema = isVariableInPayloadSchema(typedTextClean);
        const isAlreadyPending = isPendingVariable(typedTextClean);
        const alreadyOfferedInBase = options.some((opt) => opt.label === typedTextClean && opt.type === 'variable');

        if (!isAlreadyInSchema && !isAlreadyPending && !alreadyOfferedInBase) {
          const newVariableOption: Completion = {
            label: `✨ Add as new variable: ${typedTextClean}`,
            apply: (view: EditorView, _completion: Completion, _cFrom: number, _cTo: number) => {
              addPendingVariable(typedTextClean);
              const wrappedValue = `{{${typedTextClean}}}`;
              view.dispatch({
                changes: { from: word.from, to: word.to, insert: wrappedValue },
                selection: { anchor: word.from + wrappedValue.length },
              });
              onVariableSelect?.(_completion);
            },
            type: ADD_NEW_VARIABLE_TYPE,
            boost: 100,
          };
          options = [newVariableOption, ...options];
        }
      }

      const finalOptions = options.map((opt) => ({
        ...opt,
        apply:
          opt.type === ADD_NEW_VARIABLE_TYPE
            ? opt.apply
            : (view: EditorView, completionItem: Completion, _cFromItem: number, _cToItem: number) => {
                const selectedValue = completionItem.label;
                const wrappedValue = `{{${selectedValue}}}`;
                view.dispatch({
                  changes: { from: word.from, to: word.to, insert: wrappedValue },
                  selection: { anchor: word.from + wrappedValue.length },
                });
                onVariableSelect?.(completionItem);
              },
      }));

      if (finalOptions.length === 0) {
        return null;
      }

      return {
        from: word.from + 2,
        options: finalOptions,
        to: word.to,
      };
    },
    [schemaVariables, isVariableInPayloadSchema, onVariableSelect, addPendingVariable, isPendingVariable]
  );

  return autocompleteSource;
}
