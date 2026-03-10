import { RiCloseLine } from 'react-icons/ri';
import { BroomSparkle } from '../icons/broom-sparkle';
import { Badge } from '../primitives/badge';
import { CompactButton } from '../primitives/button-compact';
import { useAiChat } from './ai-chat-context';
import { ChatBody, ChatBodySkeleton } from './chat-body';

type NovuCopilotPanelProps = {
  onClose?: () => void;
};

export function NovuCopilotPanel({ onClose }: NovuCopilotPanelProps) {
  const {
    hasNoChatHistory,
    messages,
    status,
    error,
    handleStop,
    isGenerating,
    isLoading,
    isCreatingChat,
    isActionPending,
    isReviewingChanges,
    inputText,
    lastUserMessageId,
    setInputText,
    handleSendMessage,
    handleKeepAll,
    handleTryAgain,
    handleRevertMessage,
    handleDiscard,
  } = useAiChat();

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex items-center gap-0.5 rounded px-0.5 py-1">
          <div className="flex size-5 items-center justify-center">
            <BroomSparkle className="size-3" isAnimating={isGenerating} />
          </div>
          <span
            className="text-label-sm font-medium"
            style={{
              background: 'linear-gradient(90deg, #939292 0%, #646464 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Novu Copilot
          </span>
          <Badge variant="lighter" color="gray" className="ml-1">
            BETA
          </Badge>
        </div>
        {onClose ? (
          <CompactButton
            type="button"
            variant="ghost"
            size="md"
            icon={RiCloseLine}
            onClick={onClose}
            aria-label="Hide Copilot"
          />
        ) : null}
      </div>
      {isLoading ? (
        <ChatBodySkeleton />
      ) : (
        <ChatBody
          hasNoChatHistory={hasNoChatHistory}
          inputText={inputText}
          onInputChange={setInputText}
          isGenerating={isGenerating}
          status={status}
          errorMessage={error?.message}
          stop={handleStop}
          onSubmit={handleSendMessage}
          messages={messages}
          isSubmitDisabled={isCreatingChat}
          isReviewingChanges={isReviewingChanges}
          isActionPending={isActionPending}
          onKeepAll={handleKeepAll}
          onDiscard={handleDiscard}
          onTryAgain={handleTryAgain}
          onRevertMessage={handleRevertMessage}
          lastUserMessageId={lastUserMessageId}
        />
      )}
    </div>
  );
}
