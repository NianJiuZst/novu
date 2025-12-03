import {
  AiMessage,
  AiWorkflowContext,
  EmailContent,
  generateAiContent,
  GenerateContentResponse,
} from '@/api/ai';
import { requireEnvironment, useEnvironment } from '@/context/environment/hooks';
import { StepTypeEnum } from '@novu/shared';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

type UseGenerateAiContentOptions = {
  stepType: StepTypeEnum;
  context?: AiWorkflowContext;
  onSuccess?: (response: GenerateContentResponse) => void;
  onError?: (error: Error) => void;
};

export function useGenerateAiContent(options: UseGenerateAiContentOptions) {
  const { stepType, context, onSuccess, onError } = options;
  const { currentEnvironment } = useEnvironment();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [lastResponse, setLastResponse] = useState<GenerateContentResponse | null>(null);
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null);
  const [thinkingDuration, setThinkingDuration] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const environment = requireEnvironment(currentEnvironment, 'No environment selected');
      const newMessages: AiMessage[] = [...messages, { role: 'user' as const, content: userMessage }];

      const response = await generateAiContent({
        stepType,
        messages: newMessages,
        context,
        environment,
      });

      return { response, newMessages };
    },
    onMutate: () => {
      setThinkingStartTime(Date.now());
      setThinkingDuration(null);
    },
    onSuccess: ({ response, newMessages }) => {
      const duration = thinkingStartTime ? Math.round((Date.now() - thinkingStartTime) / 1000) : null;
      setThinkingDuration(duration);
      setThinkingStartTime(null);

      setMessages([
        ...newMessages,
        { role: 'assistant' as const, content: JSON.stringify(response) },
      ]);
      setLastResponse(response);
      onSuccess?.(response);
    },
    onError: (error: Error) => {
      setThinkingStartTime(null);
      setThinkingDuration(null);
      onError?.(error);
    },
  });

  const generate = useCallback(
    (prompt: string) => {
      mutation.mutate(prompt);
    },
    [mutation]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setLastResponse(null);
    setThinkingDuration(null);
    setThinkingStartTime(null);
    mutation.reset();
  }, [mutation]);

  const isEmailContent = (content: GenerateContentResponse['content']): content is EmailContent => {
    return stepType === StepTypeEnum.EMAIL && 'subject' in content && 'body' in content;
  };

  return {
    generate,
    reset,
    messages,
    lastResponse,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    thinkingDuration,
    isEmailContent,
  };
}

