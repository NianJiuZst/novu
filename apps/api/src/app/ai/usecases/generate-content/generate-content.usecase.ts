import { openai } from '@ai-sdk/openai';
import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PinoLogger } from '@novu/application-generic';
import { render as mailyRender } from '@novu/maily-render';
import { StepTypeEnum } from '@novu/shared';
import { generateObject } from 'ai';
import { z } from 'zod';
import { GenerateContentResponseDto } from '../../dtos';
import { GenerateContentCommand } from './generate-content.command';
import { BASE_SYSTEM_PROMPT, CHANNEL_GUIDELINES } from './generate-content.constants';
import {
  chatContentSchema,
  emailBlockContentSchema,
  emailHtmlContentSchema,
  inAppContentSchema,
  pushContentSchema,
  responseWrapperSchema,
  smsContentSchema,
} from './generate-content.schemas';

type EmailContent = {
  subject: string;
  body: string | Record<string, unknown>;
  bodyHtml?: string;
};

const AI_REQUEST_TIMEOUT_MS = 30000;
const AI_MAX_RETRIES = 2;
const MAX_SCHEMA_VALIDATION_RETRIES = 2;

@Injectable()
export class GenerateContentUseCase {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GenerateContentUseCase.name);
  }

  async execute(command: GenerateContentCommand): Promise<GenerateContentResponseDto> {
    this.logger.info(`Generating ${command.stepType} content for user: ${command.userId}`);

    const editorType = command.editorType;
    let response: GenerateContentResponseDto;

    try {
      response = await this.generateContent(command, editorType);
    } catch (error) {
      response = await this.handleGenerationError(command, error, editorType);
    }

    if (command.stepType === StepTypeEnum.EMAIL) {
      response.generatedEditorType = editorType === 'html' ? 'html' : 'block';
      await this.enrichEmailWithHtml(response, command.stepType);
    }

    return response;
  }

  private async generateContent(
    command: GenerateContentCommand,
    editorType?: string,
    retryCount = 0
  ): Promise<GenerateContentResponseDto> {
    const schema = this.getSchemaForStepType(command.stepType, editorType);
    const systemPrompt = this.buildSystemPrompt(command.stepType, editorType, command.context);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
      const result = await generateObject({
        model: openai('gpt-4o'),
        schema,
        schemaName: 'NotificationContent',
        schemaDescription:
          'Generate notification content with an AI message, the actual content, and optional suggested payload values. Return a flat JSON object directly without wrapping it in type/properties structure.',
        system: systemPrompt,
        messages: command.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        maxRetries: AI_MAX_RETRIES,
        abortSignal: abortController.signal,
      });

      clearTimeout(timeoutId);
      this.logger.info(`Successfully generated ${command.stepType} content`);

      return result.object as GenerateContentResponseDto;
    } catch (error) {
      clearTimeout(timeoutId);

      if (retryCount < MAX_SCHEMA_VALIDATION_RETRIES && error?.name === 'AI_NoObjectGeneratedError') {
        this.logger.warn(
          `Schema validation failed, retrying... (attempt ${retryCount + 1}/${MAX_SCHEMA_VALIDATION_RETRIES})`,
          {
            stepType: command.stepType,
            editorType,
            errorName: error.name,
            errorMessage: error.message,
            responseText: error.text?.substring(0, 500),
          }
        );

        return await this.generateContent(command, editorType, retryCount + 1);
      }

      this.handleAIError(error, command.stepType);
    }
  }

  private handleAIError(error: unknown, stepType: string): never {
    const errorObj = error as {
      name?: string;
      message?: string;
      statusCode?: number;
      url?: string;
      responseBody?: string;
      text?: string;
    };
    const errorContext = {
      stepType,
      errorName: errorObj?.name,
      errorMessage: errorObj?.message,
      statusCode: errorObj?.statusCode,
    };

    if (errorObj?.name === 'AbortError' || errorObj?.message?.includes('aborted')) {
      this.logger.error('AI request timed out', errorContext);
      throw new ServiceUnavailableException(
        'Content generation request timed out. Please try again with a simpler prompt.'
      );
    }

    if (errorObj?.statusCode) {
      this.logger.error('OpenAI API call failed', {
        ...errorContext,
        statusCode: errorObj.statusCode,
        url: errorObj.url,
        responseBody: errorObj.responseBody,
      });

      if (errorObj.statusCode === 429) {
        throw new ServiceUnavailableException('AI service is currently rate limited. Please try again in a moment.');
      }

      if (errorObj.statusCode === 401 || errorObj.statusCode === 403) {
        this.logger.error('OpenAI authentication failed - check API key configuration');
        throw new ServiceUnavailableException('AI service configuration error. Please contact support.');
      }

      if (errorObj.statusCode >= 500) {
        throw new ServiceUnavailableException('AI service is temporarily unavailable. Please try again later.');
      }

      throw new BadRequestException('Invalid request to AI service. Please check your input and try again.');
    }

    if (errorObj?.name === 'AI_NoObjectGeneratedError') {
      this.logger.error('AI failed to generate valid content after retries', {
        ...errorContext,
        responseText: errorObj?.text?.substring(0, 500),
      });
      throw new BadRequestException(
        'Failed to generate valid content. Please try rephrasing your request or use a different approach.'
      );
    }

    this.logger.error(`Unexpected error during ${stepType} content generation`, errorContext);
    throw new ServiceUnavailableException('Failed to generate content. Please try again.');
  }

  private async handleGenerationError(
    command: GenerateContentCommand,
    error: unknown,
    editorType?: string
  ): Promise<GenerateContentResponseDto> {
    if (command.stepType === StepTypeEnum.EMAIL && editorType !== 'html') {
      this.logger.warn('Block editor content generation failed, falling back to HTML', error);

      return await this.generateContent(command, 'html');
    }

    throw error;
  }

  private async enrichEmailWithHtml(response: GenerateContentResponseDto, stepType: StepTypeEnum): Promise<void> {
    if (stepType !== StepTypeEnum.EMAIL || !response.content) {
      return;
    }

    const emailContent = response.content as EmailContent;
    if (emailContent.body && typeof emailContent.body === 'object') {
      try {
        const html = await mailyRender(emailContent.body);
        emailContent.bodyHtml = html;
      } catch (error) {
        this.logger.error('Failed to render email HTML from TipTap JSON', error);
        emailContent.bodyHtml = '';
      }
    }
  }

  private getSchemaForStepType(stepType: StepTypeEnum, editorType?: string): z.ZodTypeAny {
    switch (stepType) {
      case StepTypeEnum.EMAIL: {
        const emailSchema = editorType === 'html' ? emailHtmlContentSchema : emailBlockContentSchema;

        return responseWrapperSchema(emailSchema);
      }
      case StepTypeEnum.SMS:
        return responseWrapperSchema(smsContentSchema);
      case StepTypeEnum.PUSH:
        return responseWrapperSchema(pushContentSchema);
      case StepTypeEnum.IN_APP:
        return responseWrapperSchema(inAppContentSchema);
      case StepTypeEnum.CHAT:
        return responseWrapperSchema(chatContentSchema);
      default:
        throw new Error(`Unsupported step type: ${stepType}`);
    }
  }

  private buildSystemPrompt(
    stepType: StepTypeEnum,
    editorType?: string,
    context?: GenerateContentCommand['context']
  ): string {
    let prompt = BASE_SYSTEM_PROMPT;

    const guidelineGetter = CHANNEL_GUIDELINES[stepType];
    if (guidelineGetter) {
      const guidelines = typeof guidelineGetter === 'function' ? guidelineGetter(editorType) : guidelineGetter;
      prompt += guidelines;
    }

    if (context) {
      prompt += this.buildContextSection(context);
    }

    return prompt;
  }

  private buildContextSection(context: GenerateContentCommand['context']): string {
    if (!context) {
      return '';
    }

    const sections: string[] = ['\n\nContext:'];

    if (context.workflowName) {
      sections.push(`\n- Workflow: ${context.workflowName}`);
    }

    if (context.workflowDescription) {
      sections.push(`\n- Purpose: ${context.workflowDescription}`);
    }

    if (context.variables && context.variables.length > 0) {
      sections.push(`\n- Available variables: ${context.variables.join(', ')}`);
    }

    return sections.join('');
  }
}
