import { IsAllowedVariable } from '@/utils/parseStepVariables';
import type { LiquidVariable } from '@/utils/parseStepVariables';
import { Decoration, DecorationSet, EditorView, Range } from '@uiw/react-codemirror';
import { MutableRefObject } from 'react';
import { isTypingVariable } from './utils';
import { VariablePillWidget } from './variable-pill-widget';
import { parseVariable } from '@/utils/liquid';
import { VARIABLE_REGEX_STRING } from '@/utils/liquid';

export class VariablePluginView {
  decorations: DecorationSet;

  lastCursor: number = 0;

  isTypingVariable: boolean = false;

  constructor(
    view: EditorView,
    private viewRef: MutableRefObject<EditorView | null>,
    private lastCompletionRef: MutableRefObject<{ from: number; to: number } | null>,
    private isAllowedVariable: IsAllowedVariable,
    private isVariableInSchema: (variable: LiquidVariable) => boolean,
    private onSelect?: (value: string, from: number, to: number) => void,
    private isDigestEventsVariable?: (variableName: string) => boolean
  ) {
    this.decorations = this.createDecorations(view);
    viewRef.current = view;
  }

  update(update: any) {
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      const pos = update.state.selection.main.head;
      const content = update.state.doc.toString();

      this.isTypingVariable = isTypingVariable(content, pos);
      this.decorations = this.createDecorations(update.view);
    }

    if (update.view) {
      this.viewRef.current = update.view;
    }
  }

  createDecorations(view: EditorView) {
    const decorations: Range<Decoration>[] = [];
    const content = view.state.doc.toString();
    const pos = view.state.selection.main.head;
    let match: RegExpExecArray | null = null;

    const regex = new RegExp(VARIABLE_REGEX_STRING, 'g');

    // Iterate through all variable matches in the content and add the pills
    while ((match = regex.exec(content)) !== null) {
      const parsedVar = parseVariable(match[0]);

      if (!parsedVar) {
        continue;
      }

      const { fullLiquidExpression, name: varName, filtersArray } = parsedVar;
      const start = match.index;
      const end = start + match[0].length;

      // Skip creating pills for variables that are currently being edited
      // This allows users to modify variables without the pill getting in the way
      if (this.isTypingVariable && pos > start && pos < end) {
        continue;
      }

      const liquidVarToCheck: LiquidVariable = { name: varName };

      if (!this.isAllowedVariable(liquidVarToCheck)) {
        continue;
      }

      // If it's allowed, then check if it's specifically *not* in the schema to mark as pending
      const isPending = !this.isVariableInSchema(liquidVarToCheck);

      if (varName) {
        decorations.push(
          Decoration.replace({
            widget: new VariablePillWidget(
              varName,
              fullLiquidExpression,
              start,
              end,
              filtersArray,
              this.onSelect,
              this.isDigestEventsVariable,
              isPending
            ),
            inclusive: false,
            side: -1,
          }).range(start, end)
        );
      }
    }

    this.lastCompletionRef.current = null;

    return Decoration.set(decorations, true);
  }
}
