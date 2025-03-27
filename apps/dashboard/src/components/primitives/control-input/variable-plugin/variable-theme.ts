import { EditorView } from '@uiw/react-codemirror';
import { VARIABLE_PILL_CLASS } from './';

export const variablePillTheme = EditorView.baseTheme({
  [`.${VARIABLE_PILL_CLASS} .cm-bracket`]: {
    display: 'none',
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
  [`.${VARIABLE_PILL_CLASS}[data-deletable="true"]`]: {
    paddingRight: '22px !important',
    position: 'relative',
  },
  [`.${VARIABLE_PILL_CLASS}[data-deletable="true"]::after`]: {
    content: '"\\2715"',
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '8px',
    lineHeight: '1',
    width: '10px',
    height: '10px',
    color: 'rgba(0, 0, 0, 0.5)',
    cursor: 'pointer',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5px',
    fontWeight: 'bold',
  },
  [`.${VARIABLE_PILL_CLASS}[data-deletable="true"]:hover::after`]: {
    color: 'rgba(0, 0, 0, 0.8)',
  },
});
