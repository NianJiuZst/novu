import { Button } from '@/components/primitives/button';
import { Textarea } from '@/components/primitives/textarea';
import { StepTypeEnum } from '@novu/shared';
import { RiCornerDownLeftLine, RiLoopLeftLine, RiSparklingLine } from 'react-icons/ri';
import { PROMPT_SUGGESTIONS_BY_STEP } from './constants';
import { getPlaceholderText } from './utils';

type InitialStateProps = {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
  onSuggestionClick: (suggestion: string) => void;
  onFeelingLucky: () => void;
  onLoadMore: () => void;
  visibleSuggestionsCount: number;
  stepType: StepTypeEnum;
};

export function InitialState({
  prompt,
  onPromptChange,
  onSubmit,
  onSuggestionClick,
  onFeelingLucky,
  onLoadMore,
  visibleSuggestionsCount,
  stepType,
}: InitialStateProps) {
  const placeholderText = getPlaceholderText(stepType);
  const suggestions = PROMPT_SUGGESTIONS_BY_STEP[stepType] || [];
  const hasMoreSuggestions = visibleSuggestionsCount < suggestions.length;

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="flex w-[500px] flex-col gap-2">
        <div className="flex flex-col gap-2 py-6">
          <RiSparklingLine className="size-8 text-[#0e121b]" />
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-medium leading-6 tracking-[-0.176px] text-[#0e121b]">
              Generate step content with AI
            </h3>
            <p className="text-xs font-medium leading-4 text-[#99a0ae]">
              Tell AI the intent, and we'll draft a channel-ready message, tailored to your workflow.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap content-center items-center gap-2">
          {suggestions.slice(0, visibleSuggestionsCount).map((suggestion) => (
            <Button
              key={suggestion}
              variant="secondary"
              mode="outline"
              size="2xs"
              className="h-auto rounded-full py-1.5 pl-1.5 pr-2"
              leadingIcon={RiSparklingLine}
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
          {hasMoreSuggestions && (
            <Button
              variant="secondary"
              mode="ghost"
              size="2xs"
              className="h-auto px-2 text-[#99a0ae] hover:text-[#525866]"
              trailingIcon={RiLoopLeftLine}
              onClick={onLoadMore}
            >
              Load more
            </Button>
          )}
        </div>

        <Textarea
          simple
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={placeholderText}
          className="min-h-[125px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            className="h-[26px]"
            mode="outline"
            size="2xs"
            trailingIcon={RiSparklingLine}
            onClick={onFeelingLucky}
            disabled={suggestions.length === 0}
          >
            I'm feeling lucky
          </Button>
          <Button
            variant="secondary"
            mode="filled"
            size="2xs"
            className="h-[26px]"
            trailingIcon={RiCornerDownLeftLine}
            onClick={onSubmit}
            disabled={!prompt.trim()}
          >
            Generate step
          </Button>
        </div>
      </div>
    </div>
  );
}
