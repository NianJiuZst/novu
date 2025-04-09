import { Variable, Variables } from '@maily-to/core/extensions';
import type { Editor as TiptapEditor } from '@tiptap/core';
import {
  FIXED_NAMESPACES_WITH_UNKNOWN_KEYS,
  DYNAMIC_NAMESPACES_WITH_UNKNOWN_KEYS_REGEX,
} from '@/components/variable/constants';

export enum VariableFrom {
  Content = 'content-variable',
  Bubble = 'bubble-variable',
  Repeat = 'repeat-variable',
}

export type CalculateVariablesProps = {
  query: string;
  editor: TiptapEditor;
  from: VariableFrom;
  primitives: Array<Variable>;
  arrays: Array<Variable>;
  namespaces: Array<Variable>;
  isAllowedVariable: (variable: string) => boolean;
  isEnhancedDigestEnabled: boolean;
};

function insertVariable({
  query,
  queryWithoutSuffix,
  editor,
}: {
  query: string;
  queryWithoutSuffix: string;
  editor: TiptapEditor;
}) {
  if (!query.endsWith('}}')) return;

  const from = editor?.state.selection.from - queryWithoutSuffix.length - 4;
  const to = editor?.state.selection.from;

  editor?.commands.deleteRange({ from, to });
  editor?.commands.insertContent({
    type: 'variable',
    attrs: {
      id: queryWithoutSuffix,
      label: null,
      fallback: null,
      showIfKey: null,
      required: false,
    },
  });
}

export const calculateVariables = ({
  query,
  editor,
  from,
  primitives,
  arrays,
  namespaces,
  isAllowedVariable,
  isEnhancedDigestEnabled,
}: CalculateVariablesProps): Variables | undefined => {
  const queryWithoutSuffix = query.replace(/}+$/, '');
  const filteredVariables: Array<Variable> = [];

  const newNamespaces = [...namespaces, ...getRepeatBlockEachVariable(editor)];

  if (isEnhancedDigestEnabled) {
    filteredVariables.push(...primitives, ...arrays, ...newNamespaces);
  } else {
    filteredVariables.push(...primitives, ...newNamespaces);
  }

  if (isAllowedVariable(queryWithoutSuffix) && isNamespaceVariableName(queryWithoutSuffix, newNamespaces)) {
    filteredVariables.push({ name: queryWithoutSuffix, required: false });
  }

  if (from === VariableFrom.Repeat) {
    filteredVariables.push(...arrays);
    insertVariable({ query, queryWithoutSuffix, editor });
  }

  if (from === VariableFrom.Content) {
    insertVariable({ query, queryWithoutSuffix, editor });
  }

  return dedupAndSortVariables(filteredVariables, queryWithoutSuffix);
};

const isNamespaceVariableName = (variableName: string, namespaces: Array<Variable>): boolean => {
  return namespaces.some((namespace) => variableName.toLowerCase().includes(namespace.name.toLowerCase()));
};

const getRepeatBlockEachVariable = (editor: TiptapEditor): Array<Variable> => {
  const iterableName = editor?.getAttributes('repeat')?.each;

  if (!iterableName) return [];

  return [{ name: iterableName, required: false }];
};

const dedupAndSortVariables = (variables: Array<Variable>, query: string): Array<Variable> => {
  // Filter variables that match the query
  const filteredVariables = variables.filter((variable) => variable.name.toLowerCase().includes(query.toLowerCase()));

  /**
   * When typing a variable that is not present in the list,
   * we need to check if the variable is a dynamic path.
   * If it is, we need to add the dynamic path values to the list.
   * For example, if the user types "hello" and there are dynamic paths like "steps.x.events[n].payload",
   * we need to add "steps.x.events[n].payload.hello", "payload.hello" , "subscriber.data.hello" to the list.
   * This is done to allow the user to create dynamic paths.
   */
  const dynamicStepNames = variables
    .map((entry) => entry.name.match(DYNAMIC_NAMESPACES_WITH_UNKNOWN_KEYS_REGEX))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => `${match[0]}.`);

  const dynamicNamespaces = [];

  if (query) {
    dynamicNamespaces.push(...FIXED_NAMESPACES_WITH_UNKNOWN_KEYS);
  }

  dynamicNamespaces.push(...dynamicStepNames);

  const dynamicVariables = [...dynamicNamespaces, ...dynamicStepNames].map((value) => {
    return {
      name: value + query.trim(),
      required: false,
    };
  });

  // Deduplicate based on name property
  const uniqueVariables = Array.from(
    new Map([...filteredVariables, ...dynamicVariables].map((item) => [item.name, item])).values()
  );

  // Sort variables: exact matches first, then starts with query, then alphabetically
  return uniqueVariables.sort((a, b) => {
    const aExactMatch = a.name.toLowerCase() === query.toLowerCase();
    const bExactMatch = b.name.toLowerCase() === query.toLowerCase();
    const aStartsWithQuery = a.name.toLowerCase().startsWith(query.toLowerCase());
    const bStartsWithQuery = b.name.toLowerCase().startsWith(query.toLowerCase());

    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;
    if (aStartsWithQuery && !bStartsWithQuery) return -1;
    if (!aStartsWithQuery && bStartsWithQuery) return 1;

    return a.name.localeCompare(b.name);
  });
};
