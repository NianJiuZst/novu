import { openai } from '@ai-sdk/openai';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@novu/application-generic';
import { render as mailyRender } from '@novu/maily-render';
import { StepTypeEnum } from '@novu/shared';
import { generateObject } from 'ai';
import { z } from 'zod';
import { GenerateContentResponseDto } from '../../dtos';
import { GenerateContentCommand } from './generate-content.command';

const mailyTextNodeSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  marks: z
    .array(
      z.object({
        type: z.enum(['bold', 'italic', 'underline', 'strike']),
      })
    )
    .optional(),
});

const mailyVariableNodeSchema = z.object({
  type: z.literal('variable'),
  attrs: z.object({
    id: z.string().describe('Variable name like subscriber.firstName or payload.companyName'),
    fallback: z.string().nullable().optional(),
  }),
});

const mailyParagraphSchema = z.object({
  type: z.literal('paragraph'),
  attrs: z.object({ textAlign: z.enum(['left', 'center', 'right']).nullable().optional() }).optional(),
  content: z.array(z.union([mailyTextNodeSchema, mailyVariableNodeSchema])).optional(),
});

const mailyHeadingSchema = z.object({
  type: z.literal('heading'),
  attrs: z.object({
    level: z
      .union([z.literal(1), z.literal(2), z.literal(3)])
      .describe('Heading level: 1 for main title, 2 for section, 3 for subsection'),
    textAlign: z.enum(['left', 'center', 'right']).nullable().optional(),
  }),
  content: z.array(z.union([mailyTextNodeSchema, mailyVariableNodeSchema])).optional(),
});

const mailyButtonSchema = z.object({
  type: z.literal('button'),
  attrs: z.object({
    text: z.string().describe('Button label text'),
    url: z.string().optional().describe('Button link URL'),
    isTextVariable: z.literal(false).optional(),
    isUrlVariable: z.literal(false).optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    variant: z.enum(['filled', 'outline']).optional(),
    borderRadius: z.enum(['smooth', 'sharp', 'round']).optional(),
    buttonColor: z.string().optional().describe('Hex color like #000000'),
    textColor: z.string().optional().describe('Hex color like #ffffff'),
  }),
});

const mailySpacerSchema = z.object({
  type: z.literal('spacer'),
  attrs: z.object({
    height: z.number().describe('Height in pixels, typically 8, 16, 24, or 32'),
  }),
});

const mailyDividerSchema = z.object({
  type: z.literal('horizontalRule'),
});

const mailyNodeSchema = z.union([
  mailyParagraphSchema,
  mailyHeadingSchema,
  mailyButtonSchema,
  mailySpacerSchema,
  mailyDividerSchema,
]);

const mailyBodySchema = z.object({
  type: z.literal('doc'),
  content: z.array(mailyNodeSchema).describe('Array of content nodes that make up the email body'),
});

const emailContentSchema = z.object({
  subject: z.string().describe('Email subject line - concise and engaging, under 60 characters'),
  body: mailyBodySchema.describe('Email body in Maily TipTap JSON format'),
});

const smsContentSchema = z.object({
  body: z.string().max(160).describe('SMS message body - keep under 160 characters'),
});

const pushContentSchema = z.object({
  subject: z.string().max(50).describe('Push notification title - keep under 50 characters'),
  body: z.string().max(150).describe('Push notification body - keep under 150 characters'),
});

const inAppContentSchema = z.object({
  subject: z.string().optional().describe('In-app notification subject/title'),
  body: z.string().describe('In-app notification body content'),
  primaryAction: z
    .object({
      label: z.string().describe('Primary button label'),
      url: z.string().optional().describe('URL to navigate to when clicked'),
    })
    .optional()
    .describe('Primary action button'),
  secondaryAction: z
    .object({
      label: z.string().describe('Secondary button label'),
      url: z.string().optional().describe('URL to navigate to when clicked'),
    })
    .optional()
    .describe('Secondary action button'),
});

const chatContentSchema = z.object({
  body: z.string().describe('Chat message content'),
});

const responseWrapperSchema = (contentSchema: z.ZodTypeAny) =>
  z.object({
    aiMessage: z
      .string()
      .describe('A brief, friendly message explaining what you generated and any suggestions for the user'),
    content: contentSchema,
    suggestedPayload: z
      .record(z.string(), z.string())
      .optional()
      .describe(
        'Sample values ONLY for {{payload.*}} variables used in the content. Keys should be the variable name WITHOUT the "payload." prefix (e.g., for {{payload.link}} use key "link"). NEVER include subscriber variables here - subscriber.firstName, subscriber.email etc are provided by the system.'
      ),
  });

@Injectable()
export class GenerateContentUseCase {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GenerateContentUseCase.name);
  }

  private getSchemaForStepType(stepType: StepTypeEnum) {
    switch (stepType) {
      case StepTypeEnum.EMAIL:
        return responseWrapperSchema(emailContentSchema);
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

  private getSystemPrompt(stepType: StepTypeEnum, context?: GenerateContentCommand['context']): string {
    const basePrompt = `You are a notification content expert for Novu, a notification infrastructure platform.
Your task is to generate high-quality notification content based on user requests.

Guidelines:
- Be concise and engaging
- Use professional but friendly tone
- Include personalization placeholders where appropriate using Liquid syntax: {{subscriber.firstName}}, {{payload.variableName}}
- Follow best practices for the specific notification channel`;

    const channelGuidelines: Record<string, string> = {
      [StepTypeEnum.EMAIL]: `
Email-specific guidelines:
- Subject lines should be compelling and under 60 characters
- Body must be in Maily TipTap JSON format with proper node structure
- Use heading nodes for titles (level 1 for main, 2 for sections)
- Use paragraph nodes for body text
- Use spacer nodes between sections (height: 16 or 24)
- Use button nodes for CTAs with good contrast colors
- Include variables using variable nodes with id like "subscriber.firstName" or "payload.variableName"
- Keep paragraphs short and scannable
- Structure: greeting -> main content -> CTA button -> closing`,
      [StepTypeEnum.SMS]: `
SMS-specific guidelines:
- Keep messages under 160 characters to avoid splitting
- Be direct and actionable
- Include essential information only
- Avoid special characters that might not render properly`,
      [StepTypeEnum.PUSH]: `
Push notification guidelines:
- Title should be under 50 characters
- Body should be under 150 characters
- Create urgency or value proposition
- Be specific about what the user should do`,
      [StepTypeEnum.IN_APP]: `
In-app notification guidelines:
- Can be slightly longer than push notifications
- Include action buttons when appropriate
- Be contextual to the user's current state
- Use clear, actionable language`,
      [StepTypeEnum.CHAT]: `
Chat message guidelines:
- Keep messages conversational
- Be friendly but professional
- Include relevant context
- Make it easy to respond or take action`,
    };

    let prompt = basePrompt + (channelGuidelines[stepType] || '');

    if (context) {
      prompt += '\n\nContext:';
      if (context.workflowName) {
        prompt += `\n- Workflow: ${context.workflowName}`;
      }
      if (context.workflowDescription) {
        prompt += `\n- Purpose: ${context.workflowDescription}`;
      }
      if (context.variables && context.variables.length > 0) {
        prompt += `\n- Available variables: ${context.variables.join(', ')}`;
      }
    }

    return prompt;
  }

  async execute(command: GenerateContentCommand): Promise<GenerateContentResponseDto> {
    this.logger.info(`Generating ${command.stepType} content for user: ${command.userId}`);

    const schema = this.getSchemaForStepType(command.stepType);
    const systemPrompt = this.getSystemPrompt(command.stepType, command.context);

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

    const response = result.object as GenerateContentResponseDto;

    // For email, generate HTML from TipTap JSON
    if (command.stepType === StepTypeEnum.EMAIL && response.content) {
      const emailContent = response.content as any;
      if (emailContent.body && typeof emailContent.body === 'object') {
        try {
          const html = await mailyRender(emailContent.body);
          emailContent.bodyHtml = html;
        } catch (error) {
          this.logger.error('Failed to render email HTML from TipTap JSON', error);
          // Fallback: set bodyHtml to empty string
          emailContent.bodyHtml = '';
        }
      }
    }

    return response;
  }
}
