import { AiWorkflowContext, GenerateContentResponse } from '@/api/ai';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/primitives/dialog';
import { useGenerateAiContent } from '@/hooks/use-generate-ai-content';
import { StepTypeEnum } from '@novu/shared';
import { useCallback, useMemo, useState } from 'react';
import { RiCloseLine, RiCornerDownLeftLine } from 'react-icons/ri';
import { PROMPT_SUGGESTIONS_BY_STEP } from './constants';
import { ContentPreview } from './content-preview';
import { ErrorState } from './error-state';
import { InitialState } from './initial-state';
import { LoadingState } from './loading-state';
import { safeParseJson } from './utils';

type AiSuggestionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepType: StepTypeEnum;
  context?: AiWorkflowContext;
  previewPayload?: string;
  onInsert: (content: GenerateContentResponse['content'], suggestedPayload?: Record<string, string>) => void;
};

export function AiSuggestionsDialog({
  open,
  onOpenChange,
  stepType,
  context,
  previewPayload,
  onInsert,
}: AiSuggestionsDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [visibleSuggestionsCount, setVisibleSuggestionsCount] = useState(2);
  const { isLoading, isError, error, lastResponse, generate, reset } = useGenerateAiContent({
    stepType,
    context,
  });
  const hasResponse = !!lastResponse;
  const parsedPayload = useMemo(() => (previewPayload ? safeParseJson(previewPayload) : undefined), [previewPayload]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setPrompt('');
    setVisibleSuggestionsCount(2);
    reset();
  }, [onOpenChange, reset]);

  const handleSubmit = useCallback(() => {
    if (prompt.trim()) {
      generate(prompt);
    }
  }, [prompt, generate]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setPrompt(suggestion);
      generate(suggestion);
    },
    [generate]
  );

  const handleFeelingLucky = useCallback(() => {
    const suggestions = PROMPT_SUGGESTIONS_BY_STEP[stepType] || [];
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    setPrompt(randomSuggestion);
    generate(randomSuggestion);
  }, [generate, stepType]);

  const handleLoadMore = useCallback(() => {
    const suggestions = PROMPT_SUGGESTIONS_BY_STEP[stepType] || [];
    setVisibleSuggestionsCount((prev) => Math.min(prev + 2, suggestions.length));
  }, [stepType]);

  const handleInsert = useCallback(() => {
    if (lastResponse?.content) {
      onInsert(lastResponse.content, lastResponse.suggestedPayload);
      handleClose();
    }
  }, [lastResponse, onInsert, handleClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="flex h-[80vh] w-[80vw] max-w-none flex-col gap-0 rounded-2xl border-0 bg-white p-0 shadow-[0px_8px_28px_-6px_rgba(28,40,64,0.12),0px_18px_88px_-4px_rgba(28,40,64,0.14)]"
        hideCloseButton
      >
        <DialogHeader className="shrink-0 space-y-0 border-b border-[#f2f5f8] px-3 py-1.5">
          <div className="flex w-full items-center justify-between py-2">
            <div className="flex items-center gap-1.5">
              <DialogTitle className="text-base font-medium leading-6 tracking-[-0.176px] text-[#0e121b]">
                AI suggestions
              </DialogTitle>
              <div className="rounded-lg bg-[#f2f5f8] px-2 py-0.5">
                <span className="text-[11px] font-medium uppercase leading-3 tracking-[0.22px] text-[#717784]">
                  BETA
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex size-8 items-center justify-center rounded-md text-[#99a0ae] transition-colors hover:bg-[#f2f5f8] hover:text-[#525866]"
            >
              <RiCloseLine className="size-4" />
            </button>
          </div>
          <DialogDescription className="sr-only">Generate step content with AI</DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          {!hasResponse && !isLoading && !isError ? (
            <InitialState
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleSubmit}
              onSuggestionClick={handleSuggestionClick}
              onFeelingLucky={handleFeelingLucky}
              onLoadMore={handleLoadMore}
              visibleSuggestionsCount={visibleSuggestionsCount}
              stepType={stepType}
            />
          ) : isError ? (
            <ErrorState stepType={stepType} onBackToPrompt={reset} />
          ) : isLoading ? (
            <LoadingState stepType={stepType} />
          ) : (
            <ContentPreview
              stepType={stepType}
              content={lastResponse?.content}
              previewPayload={parsedPayload}
              suggestedPayload={lastResponse?.suggestedPayload}
            />
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end border-t border-[#f2f5f8] px-3 py-1.5">
          <button
            type="button"
            onClick={handleInsert}
            disabled={!lastResponse || isLoading}
            className="flex items-center gap-1 rounded-lg bg-[#e5484d] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#dc3d43] disabled:bg-[#e1e4ea] disabled:text-[#99a0ae]"
          >
            Insert content
            <RiCornerDownLeftLine className="size-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
