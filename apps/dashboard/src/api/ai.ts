import { IEnvironment, StepTypeEnum } from '@novu/shared';
import { post } from './api.client';

export type AiMessageRole = 'user' | 'assistant';

export type AiMessage = {
  role: AiMessageRole;
  content: string;
};

export type AiWorkflowContext = {
  workflowName?: string;
  workflowDescription?: string;
  variables?: string[];
};

export type GenerateContentRequest = {
  stepType: StepTypeEnum;
  messages: AiMessage[];
  context?: AiWorkflowContext;
  environment: IEnvironment;
};

export type EmailContent = {
  subject: string;
  body: Record<string, unknown>;
  bodyHtml: string;
};

export type SmsContent = {
  body: string;
};

export type PushContent = {
  subject: string;
  body: string;
};

export type InAppAction = {
  label: string;
  url?: string;
};

export type InAppContent = {
  subject?: string;
  body: string;
  primaryAction?: InAppAction;
  secondaryAction?: InAppAction;
};

export type ChatContent = {
  body: string;
};

export type GenerateContentResponse = {
  aiMessage: string;
  content: EmailContent | SmsContent | PushContent | InAppContent | ChatContent;
  suggestedPayload?: Record<string, string>;
};

export async function generateAiContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
  const { environment, ...body } = request;
  const response = await post<{ data: GenerateContentResponse }>('/ai/content/generate', {
    body,
    environment,
  });

  return response.data;
}

