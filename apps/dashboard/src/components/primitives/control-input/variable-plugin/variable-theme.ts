import { EditorView } from '@uiw/react-codemirror';
import { VARIABLE_PILL_CLASS, UNDEFINED_VARIABLE_PILL_CLASS } from './';

export const variablePillTheme = EditorView.baseTheme({
  [`.${VARIABLE_PILL_CLASS} .cm-bracket`]: {
    display: 'none',
  },
  [`.${UNDEFINED_VARIABLE_PILL_CLASS}`]: {
    backgroundColor: 'var(--nv-colors-warning-surface-accent)', // A light yellow/amber color
    color: 'var(--nv-colors-warning-foreground-accent)',
    padding: '1px 6px', // Match default pill padding
    borderRadius: 'var(--radius)', // Match default pill radius
    border: '1px solid var(--nv-colors-warning-border-accent)',
  },
  '.cm-content': {
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  '.cm-line': {
    paddingLeft: 0,
  },
});
