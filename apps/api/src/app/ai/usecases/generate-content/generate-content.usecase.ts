import { openai } from '@ai-sdk/openai';
import { Injectable } from '@nestjs/common';
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
    editorType?: string
  ): Promise<GenerateContentResponseDto> {
    const schema = this.getSchemaForStepType(command.stepType, editorType);
    const systemPrompt = this.buildSystemPrompt(command.stepType, editorType, command.context);

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema,
      system: systemPrompt,
      messages: command.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    this.logger.info(`Successfully generated ${command.stepType} content`);

    return result.object as GenerateContentResponseDto;
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
