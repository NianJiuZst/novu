import { AiWorkflowContext, GenerateContentResponse } from '@/api/ai';
import { Badge } from '@/components/primitives/badge';
import { Button } from '@/components/primitives/button';
import { CompactButton } from '@/components/primitives/button-compact';
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
  hasExistingContent?: boolean;
  onInsert: (content: GenerateContentResponse['content'], suggestedPayload?: Record<string, string>) => void;
};

export function AiSuggestionsDialog({
  open,
  onOpenChange,
  stepType,
  context,
  previewPayload,
  hasExistingContent = false,
  onInsert,
}: AiSuggestionsDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [visibleSuggestionsCount, setVisibleSuggestionsCount] = useState(2);
  const { isLoading, isError, lastResponse, generate, reset } = useGenerateAiContent({
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

    if (suggestions.length === 0) {
      return;
    }

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
        className="flex h-[80vh] w-[80vw] max-w-none flex-col gap-0 rounded-20 border-0 bg-white p-0 shadow-md"
        hideCloseButton
      >
        <DialogHeader className="shrink-0 space-y-0 border-b border-stroke-weak px-3 py-1.5">
          <div className="flex w-full items-center justify-between py-2">
            <div className="flex items-center gap-1.5">
              <DialogTitle className="text-base font-medium leading-6 tracking-tight text-text-strong">
                AI suggestions
              </DialogTitle>
              <Badge variant="lighter" color="gray" size="sm">
                BETA
              </Badge>
            </div>
            <CompactButton variant="ghost" size="lg" icon={RiCloseLine} onClick={handleClose} />
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

        {/* Footer - Only show when loading, error, or has response */}
        {(isLoading || isError || hasResponse) && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-stroke-weak px-3 py-1.5">
            {/* Show "Keep editing" for loading, error, or success states */}
            {(isLoading || isError || hasResponse) && (
              <Button variant="secondary" className="h-[26px]" mode="outline" size="2xs" onClick={reset}>
                Keep editing
              </Button>
            )}
            {/* Show "Replace/Insert content" only on success */}
            {hasResponse && !isLoading && (
              <Button
                variant="primary"
                mode="gradient"
                size="2xs"
                className="h-[26px]"
                trailingIcon={RiCornerDownLeftLine}
                onClick={handleInsert}
              >
                {hasExistingContent ? 'Replace content' : 'Insert content'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
