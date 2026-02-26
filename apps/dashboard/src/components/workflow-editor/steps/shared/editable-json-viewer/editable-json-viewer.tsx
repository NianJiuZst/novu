import { JsonEditor } from '@visual-json/react';
import { CSSProperties, useMemo } from 'react';
import { cn } from '@/utils/ui';
import { EditableJsonViewerProps } from './types';

const VJ_THEME_VARS: Record<string, string> = {
  '--vj-bg': 'transparent',
  '--vj-bg-panel': 'hsl(var(--neutral-alpha-50))',
  '--vj-bg-hover': 'hsl(var(--neutral-alpha-100))',
  '--vj-bg-selected': 'hsl(var(--feature) / 0.12)',
  '--vj-bg-selected-muted': 'hsl(var(--neutral-alpha-100))',
  '--vj-bg-match': 'hsl(var(--highlighted) / 0.15)',
  '--vj-bg-match-active': 'hsl(var(--highlighted) / 0.25)',
  '--vj-text': 'hsl(var(--foreground-950))',
  '--vj-text-muted': 'hsl(var(--foreground-600))',
  '--vj-text-dim': 'hsl(var(--neutral-400))',
  '--vj-text-dimmer': 'hsl(var(--neutral-300))',
  '--vj-text-selected': 'hsl(var(--foreground-950))',
  '--vj-border': 'hsl(var(--neutral-alpha-200))',
  '--vj-accent': 'hsl(var(--feature))',
  '--vj-accent-muted': 'hsl(var(--feature) / 0.15)',
  '--vj-string': 'hsl(var(--highlighted))',
  '--vj-number': 'hsl(var(--information))',
  '--vj-boolean': 'hsl(var(--feature))',
  '--vj-error': 'hsl(var(--destructive))',
  '--vj-font': "'JetBrains Mono', monospace",
  '--vj-input-font-size': '12px',
};

export function EditableJsonViewer({
  value,
  onChange,
  className,
  schema,
  isReadOnly = false,
}: EditableJsonViewerProps) {
  const normalizedSchema = useMemo(() => {
    if (!schema) return null;

    return schema as any;
  }, [schema]);

  return (
    <div
      className={cn(
        'border-neutral-alpha-200 bg-background text-foreground-600',
        'mx-0 mt-0 rounded-lg border border-dashed',
        'max-h-[400px] min-h-[100px] overflow-hidden',
        'font-mono text-xs',
        'flex flex-col',
        isReadOnly && 'pointer-events-none',
        className
      )}
    >
      <JsonEditor
        value={value ?? {}}
        onChange={isReadOnly ? undefined : onChange}
        schema={normalizedSchema}
        readOnly={isReadOnly}
        sidebarOpen={false}
        treeShowValues
        editorShowDescriptions
        height="100%"
        width="100%"
        style={VJ_THEME_VARS as CSSProperties}
      />
    </div>
  );
}

export type { EditableJsonViewerProps } from './types';
