import { loadLanguage } from '@uiw/codemirror-extensions-langs';
import { useMemo } from 'react';
import { RiAlertLine } from 'react-icons/ri';
import { Editor } from '@/components/primitives/editor';
import { cn } from '@/utils/ui';

type JsonConditionsEditorProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onBlur?: () => void;
};

export function JsonConditionsEditor({ value, onChange, error, onBlur }: JsonConditionsEditorProps) {
  const formattedValue = useMemo(() => {
    if (!value) return '';

    try {
      const parsed = JSON.parse(value);

      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          'overflow-hidden rounded-lg border transition-colors',
          error ? 'border-destructive' : 'border-neutral-200'
        )}
      >
        <Editor
          value={formattedValue}
          onChange={onChange}
          onBlur={onBlur}
          extensions={[loadLanguage('json')?.extension ?? []]}
          basicSetup={{
            lineNumbers: true,
            defaultKeymap: true,
            foldGutter: true,
          }}
          multiline
          className="min-h-[200px] max-h-[500px] overflow-auto bg-white [&_.cm-editor]:py-3"
          placeholder={JSON.stringify(
            {
              and: [
                { '==': [{ var: 'payload.status' }, 'active'] },
                { '>': [{ var: 'payload.count' }, 5] },
              ],
            },
            null,
            2
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
            <RiAlertLine className="mt-0.5 size-4 shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="font-medium">Validation Error</span>
              <span className="whitespace-pre-line text-foreground-600">{error}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">
            Edit JSON Logic directly. See{' '}
            <a
              href="https://jsonlogic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-feature underline hover:no-underline"
            >
              JSON Logic documentation
            </a>{' '}
            for syntax reference.
          </p>
        )}
      </div>
    </div>
  );
}
