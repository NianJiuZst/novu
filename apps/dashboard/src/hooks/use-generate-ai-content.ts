import { AiMessage, AiWorkflowContext, EmailContent, GenerateContentResponse, generateAiContent } from '@/api/ai';
import { requireEnvironment, useEnvironment } from '@/context/environment/hooks';
import { StepTypeEnum } from '@novu/shared';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

type UseGenerateAiContentOptions = {
  stepType: StepTypeEnum;
  context?: AiWorkflowContext;
  editorType?: string;
  onSuccess?: (response: GenerateContentResponse) => void;
  onError?: (error: Error) => void;
};

export function useGenerateAiContent(options: UseGenerateAiContentOptions) {
  const { stepType, context, editorType, onSuccess, onError } = options;
  const { currentEnvironment } = useEnvironment();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [lastResponse, setLastResponse] = useState<GenerateContentResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const environment = requireEnvironment(currentEnvironment, 'No environment selected');
      const newMessages: AiMessage[] = [...messages, { role: 'user' as const, content: userMessage }];

      const response = await generateAiContent({
        stepType,
        messages: newMessages,
        context,
        editorType,
        environment,
      });

      return { response, newMessages };
    },
    onSuccess: ({ response, newMessages }) => {
      setMessages([...newMessages, { role: 'assistant' as const, content: JSON.stringify(response) }]);
      setLastResponse(response);
      onSuccess?.(response);
    },
    onError: (error: Error) => {
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
    isEmailContent,
  };
}
