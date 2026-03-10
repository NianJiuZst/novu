import { UIMessage, useChat as useChatStream } from '@ai-sdk/react';
import { AiAgentTypeEnum } from '@novu/shared';
import {
  ChatOnDataCallback,
  ChatOnFinishCallback,
  ChatOnToolCallCallback,
  DataUIPart,
  DefaultChatTransport,
  UIDataTypes,
  UITools,
} from 'ai';
import { useCallback, useMemo, useState } from 'react';
import { getChatStreamUrl } from '@/api/ai';
import { useEnvironment } from '@/context/environment/hooks';
import { getToken } from '@/utils/auth';
import { useDataRef } from './use-data-ref';

const AI_CHAT_REQUEST_TIMEOUT_MS = 120_000;

function getAiChatTimeoutError({ timeoutMs, chatId }: { timeoutMs: number; chatId: string }): Error {
  const timeoutSeconds = Math.round(timeoutMs / 1000);

  return new Error(
    `Novu AI request timed out after ${timeoutSeconds}s (chat ${chatId}). Please try again. If this keeps happening, share this chat ID with support.`
  );
}

function createTimedFetch({ timeoutMs, chatId }: { timeoutMs: number; chatId: string }): typeof fetch {
  return async (input, init) => {
    const requestSignal = init?.signal;
    const timeoutAbortController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutAbortController.abort(getAiChatTimeoutError({ timeoutMs, chatId }));
    }, timeoutMs);

    const handleRequestAbort = () => {
      timeoutAbortController.abort(requestSignal?.reason);
    };

    if (requestSignal) {
      if (requestSignal.aborted) {
        handleRequestAbort();
      } else {
        requestSignal.addEventListener('abort', handleRequestAbort, { once: true });
      }
    }

    try {
      return await fetch(input, { ...init, signal: timeoutAbortController.signal });
    } catch (error) {
      if (timeoutAbortController.signal.aborted && !requestSignal?.aborted) {
        throw getAiChatTimeoutError({ timeoutMs, chatId });
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
      requestSignal?.removeEventListener('abort', handleRequestAbort);
    }
  };
}

type UseAiChatOptions<D extends UIDataTypes = UIDataTypes, T extends UITools = UITools> = {
  id: string;
  agentType: AiAgentTypeEnum;
  initialMessages?: UIMessage<unknown, D, T>[];
  onData?: ChatOnDataCallback<UIMessage>;
  onToolCall?: ChatOnToolCallCallback<UIMessage>;
  onFinish?: ChatOnFinishCallback<UIMessage<unknown, D, T>>;
  onError?: (error: Error) => void;
};

export function useAiChatStream<D extends UIDataTypes = UIDataTypes, T extends UITools = UITools>({
  id,
  agentType,
  initialMessages,
  onData,
  onToolCall,
  onFinish,
  onError,
}: UseAiChatOptions<D, T>) {
  const { currentEnvironment } = useEnvironment();
  const environmentIdRef = useDataRef(currentEnvironment?._id);
  const agentTypeRef = useDataRef(agentType);
  const [isAborted, setIsAborted] = useState(false);

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: getChatStreamUrl(),
      headers: async () => {
        const token = await getToken();

        return {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(environmentIdRef.current && { 'Novu-Environment-Id': environmentIdRef.current }),
        };
      },
      fetch: createTimedFetch({ timeoutMs: AI_CHAT_REQUEST_TIMEOUT_MS, chatId: id }),
      prepareSendMessagesRequest: (options) => {
        const resumeMessage = options.messages.length > 0 ? options.messages[options.messages.length - 1] : null;
        const isResume = (options.requestMetadata as { resume?: boolean })?.resume ?? false;

        return {
          body: {
            id: options.id,
            message: isResume ? undefined : resumeMessage,
            agentType: agentTypeRef.current,
            ...options.body,
          },
        };
      },
    });
  }, [environmentIdRef, agentTypeRef, id]);

  const { messages, sendMessage, status, error, stop, setMessages } = useChatStream<UIMessage<unknown, D, T>>({
    id,
    messages: initialMessages,
    transport,
    experimental_throttle: 50,
    onFinish,
    onData,
    onToolCall,
    onError,
  });

  const isGenerating = status === 'streaming' || status === 'submitted';

  const sendPrompt = useCallback(
    ({ messageId, chatId, prompt }: { messageId?: string; chatId?: string; prompt: string }) => {
      setIsAborted(false);
      return sendMessage({ text: prompt, messageId }, { body: { id: chatId, agentType } });
    },
    [sendMessage, agentType]
  );

  const resume = useCallback(() => {
    setIsAborted(false);
    sendMessage(undefined, { metadata: { resume: true } });
  }, [sendMessage]);

  const isReady = status === 'ready';

  const reasoningParts = useMemo(() => {
    return messages.filter((m) => m.role === 'assistant').flatMap((m) => m.parts.filter((p) => p.type === 'reasoning'));
  }, [messages]);

  const textParts = useMemo(() => {
    return messages.filter((m) => m.role === 'assistant').flatMap((m) => m.parts.filter((p) => p.type === 'text'));
  }, [messages]);

  const dataParts: DataUIPart<D>[] = useMemo(() => {
    return messages
      .filter((m) => m.role === 'assistant')
      .flatMap((m) => m.parts.filter((p) => p.type.startsWith('data-'))) as DataUIPart<D>[];
  }, [messages]);

  const handleStop = useCallback(() => {
    setIsAborted(true);
    stop();
  }, [stop]);

  return {
    id,
    messages,
    sendPrompt,
    status,
    error,
    isAborted,
    stop: handleStop,
    setMessages,
    resume,
    isGenerating,
    isReady,
    reasoningParts,
    textParts,
    dataParts,
  };
}
