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
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className="flex items-center gap-1 rounded-full border border-[#e1e4ea] bg-white py-1.5 pl-1.5 pr-2 text-xs font-medium text-[#525866] transition-colors hover:bg-neutral-50"
            >
              <RiSparklingLine className="size-4 text-[#99a0ae]" />
              <span>{suggestion}</span>
            </button>
          ))}
          {hasMoreSuggestions && (
            <button
              type="button"
              onClick={onLoadMore}
              className="flex items-center px-2 text-xs font-medium text-[#99a0ae] transition-colors hover:text-[#525866]"
            >
              Load more
              <RiLoopLeftLine className="size-5 p-[5px]" />
            </button>
          )}
        </div>

        <div className="h-[125px] min-h-[125px] overflow-hidden rounded-xl border border-[#e1e4ea] bg-white p-px shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={placeholderText}
            className="h-full w-full resize-none border-0 bg-transparent p-3 text-xs font-normal leading-4 text-[#0e121b] outline-none placeholder:text-[#99a0ae]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onFeelingLucky}
            disabled={suggestions.length === 0}
            className="flex items-center gap-0.5 rounded-lg bg-white p-1.5 text-xs font-medium text-[#525866] shadow-[0px_1px_3px_0px_rgba(14,18,27,0.12),0px_0px_0px_1px_#e1e4ea] transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="px-1">I'm feeling lucky</span>
            <RiSparklingLine className="size-4 text-[#525866]" />
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!prompt.trim()}
            className="flex items-center gap-1 rounded-lg bg-[#f4f5f6] py-1.5 pl-2 pr-1 text-xs font-medium text-[#cacfd8] transition-colors disabled:cursor-not-allowed [&:not(:disabled)]:bg-[#0e121b] [&:not(:disabled)]:text-white"
          >
            Generate step
            <RiCornerDownLeftLine className="size-4 p-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
