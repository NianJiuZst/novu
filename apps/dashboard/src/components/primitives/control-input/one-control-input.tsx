import { useCallback, useEffect, useMemo, useRef } from 'react';
import { autocompletion } from '@codemirror/autocomplete';
import { EditorView } from '@uiw/react-codemirror';
import { cn } from '@/utils/ui';
import { cva } from 'class-variance-authority';

import { Editor } from '@/components/primitives/editor';
import { createAutocompleteSource } from '@/utils/liquid-autocomplete';
import { LiquidVariable } from '@/utils/parseStepVariablesToLiquidVariables';
import { useVariables } from './hooks/use-variables';
import { createVariableExtension } from './variable-plugin';
import { variablePillTheme } from './variable-plugin/variable-theme';
import { EditVariablePopover } from '@/components/variable/edit-variable-popover';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';

const variants = cva('relative w-full', {
  variants: {
    size: {
      md: 'p-2.5',
      sm: 'p-2.5',
      '2xs': 'px-2 py-1.5',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

type CompletionRange = {
  from: number;
  to: number;
};

type OneControlInputProps = {
  className?: string;
  value: string;
  onChange: (value: string) => void;
  variables: LiquidVariable[];
  placeholder?: string;
  autoFocus?: boolean;
  size?: 'md' | 'sm' | '2xs';
  id?: string;
  multiline?: boolean;
  indentWithTab?: boolean;
};

export function OneControlInput({
  value,
  onChange,
  variables,
  className,
  placeholder,
  autoFocus,
  id,
  multiline = false,
  size = 'sm',
  indentWithTab,
}: OneControlInputProps) {
  const viewRef = useRef<EditorView | null>(null);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const lastCompletionRef = useRef<CompletionRange | null>(null);

  // Register the editor view globally so delete handlers can find it
  useEffect(() => {
    if (editorRef.current && editorRef.current.view) {
      viewRef.current = editorRef.current.view;
      (window as any).__CM_EDITOR_VIEW = editorRef.current.view;
    }

    return () => {
      // Cleanup on unmount
      if ((window as any).__CM_EDITOR_VIEW === viewRef.current) {
        (window as any).__CM_EDITOR_VIEW = null;
      }
    };
  }, [editorRef.current]);

  const { selectedVariable, setSelectedVariable, handleVariableSelect, handleVariableUpdate } = useVariables(
    viewRef,
    onChange
  );

  const completionSource = useMemo(() => createAutocompleteSource(variables, 'free-text'), [variables]);

  const autocompletionExtension = useMemo(
    () =>
      autocompletion({
        override: [completionSource],
        closeOnBlur: true,
        defaultKeymap: true,
        activateOnTyping: true,
      }),
    [completionSource]
  );

  const variablePluginExtension = useMemo(
    () =>
      createVariableExtension({
        viewRef,
        lastCompletionRef,
        onSelect: handleVariableSelect,
        allowDelete: true,
      }),
    [handleVariableSelect]
  );

  const extensions = useMemo(() => {
    const baseExtensions = [...(multiline ? [EditorView.lineWrapping] : []), variablePillTheme];
    return [...baseExtensions, autocompletionExtension, variablePluginExtension];
  }, [autocompletionExtension, variablePluginExtension, multiline]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setTimeout(() => setSelectedVariable(null), 0);
      }
    },
    [setSelectedVariable]
  );

  const hasVariable = useMemo(() => {
    if (!value) return false;
    const variableRegex = /\{\{([^}]+)\}\}/;
    return variableRegex.test(value);
  }, [value]);

  return (
    <div className={variants({ size, className })}>
      <Editor
        ref={editorRef}
        fontFamily="inherit"
        multiline={multiline}
        indentWithTab={indentWithTab}
        size={size}
        className={cn('flex-1', { 'overflow-hidden': !multiline })}
        autoFocus={autoFocus}
        placeholder={placeholder}
        id={id}
        extensions={extensions}
        value={value}
        onChange={onChange}
        editable={!hasVariable}
      />
      <EditVariablePopover
        open={!!selectedVariable}
        onOpenChange={handleOpenChange}
        variable={selectedVariable?.value}
        onUpdate={(newValue) => {
          handleVariableUpdate(newValue);
          viewRef.current?.focus();
        }}
      >
        <div />
      </EditVariablePopover>
    </div>
  );
}
