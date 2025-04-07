import { Editor } from '@maily-to/core';

import type { Editor as TiptapEditor } from '@tiptap/core';
import { HTMLAttributes, useCallback, useMemo, useState } from 'react';
import { FeatureFlagsKeysEnum } from '@novu/shared';

import { useWorkflow } from '@/components/workflow-editor/workflow-provider';
import { useParseVariables } from '@/hooks/use-parse-variables';
import { useTelemetry } from '@/hooks/use-telemetry';
import { cn } from '@/utils/ui';
import { createEditorBlocks, createExtensions, DEFAULT_EDITOR_CONFIG, MAILY_EMAIL_WIDTH } from './maily-config';
import { calculateVariables, VariableFrom } from './variables/variables';
import { RepeatMenuDescription } from './views/repeat-menu-description';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { DYNAMIC_PATH_ROOTS, DYNAMIC_STEP_NAME_ROOT_REGEX } from '@/utils/constants';

type MailyProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  onChange?: (value: string) => void;
  className?: string;
};

export const Maily = ({ value, onChange, className, ...rest }: MailyProps) => {
  const { step } = useWorkflow();
  const isEnhancedDigestEnabled = useFeatureFlag(FeatureFlagsKeysEnum.IS_ENHANCED_DIGEST_ENABLED);
  const parsedVariables = useParseVariables(step?.variables);
  const primitives = useMemo(
    () => parsedVariables.primitives.map((v) => ({ name: v.label, required: false })),
    [parsedVariables.primitives]
  );
  const arrays = useMemo(
    () => parsedVariables.arrays.map((v) => ({ name: v.label, required: false })),
    [parsedVariables.arrays]
  );
  const namespaces = useMemo(
    () => parsedVariables.namespaces.map((v) => ({ name: v.label, required: false })),
    [parsedVariables.namespaces]
  );
  const [_, setEditor] = useState<any>();
  const track = useTelemetry();

  const handleCalculateVariables = useCallback(
    ({ query, editor, from }: { query: string; editor: TiptapEditor; from: VariableFrom }) => {
      return calculateVariables({
        query,
        editor,
        from,
        primitives,
        arrays,
        namespaces,
        isAllowedVariable: parsedVariables.isAllowedVariable,
        isEnhancedDigestEnabled,
      });
    },
    [primitives, arrays, namespaces, parsedVariables.isAllowedVariable, isEnhancedDigestEnabled]
  );

  const extensions = useMemo(
    () => createExtensions({ calculateVariables: handleCalculateVariables, parsedVariables }),
    [handleCalculateVariables, parsedVariables]
  );

  /*
   * Override Maily tippy box styles as a temporary solution.
   * Note: These styles affect both the bubble menu and block manipulation buttons (drag & drop, add).
   * TODO: Request Maily to expose these components or provide specific CSS selectors for individual targeting.
   */
  const overrideTippyBoxStyles = () => (
    <style>
      {`
          .tippy-box {
            padding-right: 20px;
            pointer-events: auto;

            .mly-cursor-grab {
              background-color: #fff;
              border-radius: 4px;
              box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.02);
              border-radius: 4px;
              margin: 2px;
            }
          }
        `}
    </style>
  );

  return (
    <>
      {overrideTippyBoxStyles()}
      <div
        className={cn(
          `shadow-xs mx-auto flex min-h-full max-w-[${MAILY_EMAIL_WIDTH}px] flex-col items-start rounded-lg bg-white`,
          className
        )}
        {...rest}
      >
        <Editor
          key="repeat-block-enabled"
          config={DEFAULT_EDITOR_CONFIG}
          blocks={createEditorBlocks({ track })}
          extensions={extensions}
          contentJson={value ? JSON.parse(value) : undefined}
          onCreate={setEditor}
          onUpdate={(editor) => {
            setEditor(editor);

            if (onChange) {
              onChange(JSON.stringify(editor.getJSON()));
            }
          }}
          repeatMenuConfig={{
            description: (editor) => <RepeatMenuDescription editor={editor} />,
          }}
        />
      </div>
    </>
  );
};

const dedupAndSortVariables = (
  variables: { name: string; required: boolean }[],
  query: string
): { name: string; required: boolean }[] => {
  // Filter variables that match the query
  let filteredVariables = variables.filter((variable) => variable.name.toLowerCase().includes(query.toLowerCase()));

  if (filteredVariables.length === 0 && variables.length > 0) {
    /**
     * When typing a variable that is not present in the list,
     * we need to check if the variable is a dynamic path.
     * If it is, we need to add the dynamic path values to the list.
     * For example, if the user types "hello" and there are dynamic paths like "steps.x.events[n].payload",
     * we need to add "steps.x.events[n].payload.hello", "payload.hello" , "subscriber.data.hello" to the list.
     * This is done to allow the user to create dynamic paths.
     */
    const dynamicStepNames = variables
      .map((entry) => entry.name.match(DYNAMIC_STEP_NAME_ROOT_REGEX))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => `${match[0]}.`);

    filteredVariables = [...DYNAMIC_PATH_ROOTS, ...dynamicStepNames].map((value) => {
      return {
        name: value + query.trim(),
        required: false,
      };
    });
  }

  // Deduplicate based on name property
  const uniqueVariables = Array.from(new Map(filteredVariables.map((item) => [item.name, item])).values());

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
