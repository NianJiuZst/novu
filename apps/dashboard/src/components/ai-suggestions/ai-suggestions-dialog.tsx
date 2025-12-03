import { AiWorkflowContext, GenerateContentResponse } from '@/api/ai';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/primitives/dialog';
import { ChatPreview } from '@/components/workflow-editor/steps/chat/chat-preview';
import { InboxPreview } from '@/components/workflow-editor/steps/in-app/inbox-preview';
import { EmailCorePreview } from '@/components/workflow-editor/steps/preview/previews/email-preview-wrapper';
import { PushPreview } from '@/components/workflow-editor/steps/push/push-preview';
import { SmsPreview } from '@/components/workflow-editor/steps/sms/sms-preview';
import { useGenerateAiContent } from '@/hooks/use-generate-ai-content';
import { ChannelTypeEnum, GeneratePreviewResponseDto, ResourceOriginEnum, StepTypeEnum } from '@novu/shared';
import { useCallback, useMemo, useState } from 'react';
import { RiCloseLine, RiCornerDownLeftLine, RiLoopLeftLine, RiSparklingLine } from 'react-icons/ri';

const PROMPT_SUGGESTIONS = [
  'Write a friendly welcome email',
  'Create a password reset notification',
  'Draft an order confirmation message',
  'Compose a weekly digest email',
];

// Parse Liquid-style variables {{variable}} with real values from preview payload and suggested payload
function parseVariablesForPreview(
  text: string,
  previewPayload?: Record<string, unknown>,
  suggestedPayload?: Record<string, string>
): string {
  if (!text) return text;

  return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const trimmedVar = variable.trim();
    
    // Try to get value from preview payload first
    if (previewPayload) {
      const value = getNestedValue(previewPayload, trimmedVar);
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }
    
    // Fallback to suggested payload for payload.* variables
    if (suggestedPayload && trimmedVar.startsWith('payload.')) {
      const payloadKey = trimmedVar.replace('payload.', '');
      if (suggestedPayload[payloadKey]) {
        return suggestedPayload[payloadKey];
      }
    }
    
    // Return empty string if not found (cleaner preview)
    return '';
  });
}

// Get nested value from object using dot notation (e.g., "subscriber.firstName")
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return current;
}

// Safely parse JSON string to object
function safeParseJson(json: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

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
  const { isLoading, isError, error, lastResponse, generate, reset } = useGenerateAiContent({
    stepType,
    context,
  });
  const hasResponse = !!lastResponse;
  const parsedPayload = useMemo(() => previewPayload ? safeParseJson(previewPayload) : undefined, [previewPayload]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setPrompt('');
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
    const randomSuggestion = PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)];
    setPrompt(randomSuggestion);
    generate(randomSuggestion);
  }, [generate]);

  const handleInsert = useCallback(() => {
    console.log('handleInsert clicked', { lastResponse });
    if (lastResponse?.content) {
      console.log('Calling onInsert with:', { content: lastResponse.content, suggestedPayload: lastResponse.suggestedPayload });
      onInsert(lastResponse.content, lastResponse.suggestedPayload);
      handleClose();
    } else {
      console.log('No lastResponse or content available');
    }
  }, [lastResponse, onInsert, handleClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="flex h-[80vh] w-[80vw] max-w-none flex-col gap-0 rounded-2xl border-0 bg-white p-0 shadow-[0px_8px_28px_-6px_rgba(28,40,64,0.12),0px_18px_88px_-4px_rgba(28,40,64,0.14)]"
        hideCloseButton
      >
        {/* Header */}
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

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {!hasResponse && !isLoading ? (
            <InitialState
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleSubmit}
              onSuggestionClick={handleSuggestionClick}
              onFeelingLucky={handleFeelingLucky}
              stepType={stepType}
            />
          ) : isLoading ? (
            <LoadingState stepType={stepType} />
          ) : (
            <ContentPreview
              stepType={stepType}
              content={lastResponse?.content}
              isError={isError}
              error={error}
              previewPayload={parsedPayload}
              suggestedPayload={lastResponse?.suggestedPayload}
            />
          )}
        </div>

        {/* Footer */}
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

function getPlaceholderText(stepType: StepTypeEnum): string {
  const placeholders: Record<string, string> = {
    [StepTypeEnum.EMAIL]: 'Describe the email you want to generate...',
    [StepTypeEnum.SMS]: 'Describe the SMS message you want to generate...',
    [StepTypeEnum.PUSH]: 'Describe the push notification you want to generate...',
    [StepTypeEnum.IN_APP]: 'Describe the in-app notification you want to generate...',
    [StepTypeEnum.CHAT]: 'Describe the chat message you want to generate...',
  };

  return placeholders[stepType] || 'Describe what you want to generate...';
}

function getChannelLabel(stepType: StepTypeEnum): string {
  const labels: Record<string, string> = {
    [StepTypeEnum.EMAIL]: 'email',
    [StepTypeEnum.SMS]: 'SMS',
    [StepTypeEnum.PUSH]: 'push notification',
    [StepTypeEnum.IN_APP]: 'in-app notification',
    [StepTypeEnum.CHAT]: 'chat message',
  };

  return labels[stepType] || 'content';
}

type InitialStateProps = {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
  onSuggestionClick: (suggestion: string) => void;
  onFeelingLucky: () => void;
  stepType: StepTypeEnum;
};

function InitialState({
  prompt,
  onPromptChange,
  onSubmit,
  onSuggestionClick,
  onFeelingLucky,
  stepType,
}: InitialStateProps) {
  const placeholderText = getPlaceholderText(stepType);

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="flex w-[500px] flex-col gap-2">
        {/* Header with icon and text */}
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

        {/* Suggestion pills */}
        <div className="flex flex-wrap content-center items-center gap-2">
          {PROMPT_SUGGESTIONS.slice(0, 2).map((suggestion) => (
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
          <button
            type="button"
            onClick={onFeelingLucky}
            className="flex items-center px-2 text-xs font-medium text-[#99a0ae] transition-colors hover:text-[#525866]"
          >
            Load more
            <RiLoopLeftLine className="size-5 p-[5px]" />
          </button>
        </div>

        {/* Textarea */}
        <div className="h-[125px] min-h-[125px] overflow-hidden rounded-xl border border-[#e1e4ea] bg-white p-px shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={placeholderText}
            className="h-full w-full resize-none border-0 bg-transparent p-3 text-xs font-normal leading-4 text-[#0e121b] outline-none placeholder:text-[#99a0ae]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onFeelingLucky}
            className="flex items-center gap-0.5 rounded-lg bg-white p-1.5 text-xs font-medium text-[#525866] shadow-[0px_1px_3px_0px_rgba(14,18,27,0.12),0px_0px_0px_1px_#e1e4ea] transition-colors hover:bg-neutral-50"
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

type LoadingStateProps = {
  stepType: StepTypeEnum;
};

function LoadingState({ stepType }: LoadingStateProps) {
  const channelLabel = getChannelLabel(stepType);

  // Use the existing preview components with isPreviewPending={true} for loading state
  const renderLoadingPreview = () => {
    switch (stepType) {
      case StepTypeEnum.EMAIL:
        return (
          <EmailCorePreview
            previewData={undefined}
            isPreviewPending={true}
            isCustomHtmlEditor={true}
            resourceOrigin={ResourceOriginEnum.NOVU_CLOUD}
          />
        );
      case StepTypeEnum.SMS:
        return <SmsPreview previewData={undefined} isPreviewPending={true} />;
      case StepTypeEnum.PUSH:
        return <PushPreview previewData={undefined} isPreviewPending={true} />;
      case StepTypeEnum.IN_APP:
        return <InboxPreview previewData={undefined} isPreviewPending={true} />;
      case StepTypeEnum.CHAT:
        return <ChatPreview previewData={undefined} isPreviewPending={true} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-hidden p-8">
      <div className="flex h-full w-full max-w-4xl flex-col items-center gap-6">
        {/* Generating text */}
        <div className="relative overflow-hidden">
          <span className="text-sm text-[#99a0ae]">Generating {channelLabel}...</span>
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>

        {/* Preview with loading skeleton */}
        <div className="h-full min-h-0 w-full overflow-auto">{renderLoadingPreview()}</div>
      </div>
    </div>
  );
}

type ContentPreviewProps = {
  stepType: StepTypeEnum;
  content?: GenerateContentResponse['content'];
  isError: boolean;
  error: Error | null;
  previewPayload?: Record<string, unknown>;
  suggestedPayload?: Record<string, string>;
};

function ContentPreview({ stepType, content, isError, error, previewPayload, suggestedPayload }: ContentPreviewProps) {
  // Transform AI content to GeneratePreviewResponseDto format based on stepType
  // Parse variables using real preview payload data and AI suggested payload
  const previewData = useMemo((): GeneratePreviewResponseDto | undefined => {
    if (!content) return undefined;

    const basePayload = { previewPayloadExample: {} };
    const parse = (text: string) => parseVariablesForPreview(text, previewPayload, suggestedPayload);

    switch (stepType) {
      case StepTypeEnum.EMAIL: {
        const emailContent = content as { subject: string; body: string | object; bodyHtml: string };
        const parsedBody = parse(emailContent.bodyHtml || '');
        
        return {
          ...basePayload,
          result: {
            type: ChannelTypeEnum.EMAIL,
            preview: {
              subject: parse(emailContent.subject || ''),
              body: parsedBody,
            },
          },
        };
      }

      case StepTypeEnum.SMS: {
        const smsContent = content as { body: string };
        return {
          ...basePayload,
          result: {
            type: ChannelTypeEnum.SMS,
            preview: {
              body: parse(smsContent.body || ''),
            },
          },
        };
      }

      case StepTypeEnum.PUSH: {
        const pushContent = content as { subject: string; body: string };
        return {
          ...basePayload,
          result: {
            type: ChannelTypeEnum.PUSH,
            preview: {
              subject: parse(pushContent.subject || ''),
              body: parse(pushContent.body || ''),
            },
          },
        };
      }

      case StepTypeEnum.IN_APP: {
        const inAppContent = content as {
          subject?: string;
          body?: string;
          primaryAction?: { label: string; url?: string };
          secondaryAction?: { label: string; url?: string };
        };
        
        return {
          ...basePayload,
          result: {
            type: ChannelTypeEnum.IN_APP,
            preview: {
              subject: parse(inAppContent.subject || ''),
              body: parse(inAppContent.body || ''),
              ...(inAppContent.primaryAction && {
                primaryAction: {
                  label: inAppContent.primaryAction.label,
                  ...(inAppContent.primaryAction.url && {
                    redirect: { url: parse(inAppContent.primaryAction.url) },
                  }),
                },
              }),
              ...(inAppContent.secondaryAction && {
                secondaryAction: {
                  label: inAppContent.secondaryAction.label,
                  ...(inAppContent.secondaryAction.url && {
                    redirect: { url: parse(inAppContent.secondaryAction.url) },
                  }),
                },
              }),
            },
          },
        };
      }

      case StepTypeEnum.CHAT: {
        const chatContent = content as { body: string };
        return {
          ...basePayload,
          result: {
            type: ChannelTypeEnum.CHAT,
            preview: {
              body: parse(chatContent.body || ''),
            },
          },
        };
      }

      default:
        return undefined;
    }
  }, [content, stepType, previewPayload, suggestedPayload]);

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-xl bg-red-50">
            <RiCloseLine className="size-8 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#0e121b]">Generation failed</p>
            <p className="text-xs text-red-500">{error?.message || 'An error occurred'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!content || !previewData) {
    return null;
  }

  // Use existing preview components with consistent wrapper
  const renderPreview = () => {
    switch (stepType) {
      case StepTypeEnum.EMAIL:
        return (
          <EmailCorePreview
            previewData={previewData}
            isPreviewPending={false}
            isCustomHtmlEditor={true}
            resourceOrigin={ResourceOriginEnum.NOVU_CLOUD}
          />
        );
      case StepTypeEnum.SMS:
        return <SmsPreview previewData={previewData} isPreviewPending={false} />;
      case StepTypeEnum.PUSH:
        return <PushPreview previewData={previewData} isPreviewPending={false} />;
      case StepTypeEnum.IN_APP:
        return <InboxPreview previewData={previewData} isPreviewPending={false} />;
      case StepTypeEnum.CHAT:
        return <ChatPreview previewData={previewData} isPreviewPending={false} />;
      default:
        return (
          <div className="max-w-md rounded-lg border border-[#e1e4ea] bg-[#fbfbfb] p-4">
            <pre className="whitespace-pre-wrap text-left text-xs text-[#525866]">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center overflow-hidden p-8">
      <div className="h-full w-full max-w-4xl overflow-auto">{renderPreview()}</div>
    </div>
  );
}
