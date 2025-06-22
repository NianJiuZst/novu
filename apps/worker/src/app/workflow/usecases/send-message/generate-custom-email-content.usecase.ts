import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

import { IFilterVariables, Instrument, InstrumentUsecase } from '@novu/application-generic';

export interface GenerateCustomEmailContentCommand {
  contentPrompt: string;
  context: IFilterVariables;
  eventName: string;
  eventContext: Record<string, any>;
  workflowName?: string;
}

export interface GeneratedEmailContent {
  subject: string;
  body: string;
  success: boolean;
  reason?: string;
}

@Injectable()
export class GenerateCustomEmailContent {
  private readonly logger = new Logger(GenerateCustomEmailContent.name);

  @InstrumentUsecase()
  public async execute(command: GenerateCustomEmailContentCommand): Promise<GeneratedEmailContent> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(command);

      const result = await generateText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3,
        maxTokens: 1000,
      });

      return this.parseAIResponse(result.text);
    } catch (error) {
      this.logger.error('Failed to generate custom email content', error);

      return {
        subject: 'Notification Alert',
        body: 'You have a new notification that matches your custom preferences.',
        success: false,
        reason: 'AI content generation failed, using fallback content',
      };
    }
  }

  private buildSystemPrompt(): string {
    return `You are an AI assistant that generates personalized email content based on user preferences and event context.

Your task is to create engaging, relevant email content that matches the user's specific requirements while maintaining professional email standards.

You must respond with a JSON object containing:
- "subject": string (concise, compelling email subject line, max 60 characters)
- "body": string (well-formatted email body in HTML format with proper structure)
- "success": boolean (true if generation was successful)
- "reason": string (brief explanation if generation failed, or "Successfully generated" if successful)

Guidelines for email content:
- Use proper HTML formatting with paragraphs, line breaks, and structure
- Include relevant event data naturally in the content
- Make the content actionable and clear
- Use a professional but friendly tone
- Include proper greeting and closing
- Ensure the content matches the user's intent from their prompt

Example response:
{
  "subject": "Security Alert: Critical Issue Detected",
  "body": "<p>Hello,</p><p>We detected a critical security issue in your production environment that requires immediate attention.</p><p><strong>Alert Details:</strong><br/>- Type: SQL Injection Attempt<br/>- Environment: Production<br/>- Time: 2024-01-15 10:30 AM</p><p>Please review and take appropriate action.</p><p>Best regards,<br/>Security Team</p>",
  "success": true,
  "reason": "Successfully generated"
}`;
  }

  private buildUserPrompt(command: GenerateCustomEmailContentCommand): string {
    const { contentPrompt, context, eventName, eventContext, workflowName } = command;

    const contextInfo = {
      eventName,
      eventContext,
      workflowName: workflowName || 'Custom Notification',
      subscriber: {
        subscriberId: context.subscriber?.subscriberId,
        email: context.subscriber?.email,
        firstName: context.subscriber?.firstName,
        lastName: context.subscriber?.lastName,
      },
      ...(context.actor && {
        actor: {
          subscriberId: context.actor.subscriberId,
          email: context.actor.email,
          firstName: context.actor.firstName,
          lastName: context.actor.lastName,
        },
      }),
      ...(context.tenant && {
        tenant: {
          identifier: context.tenant.identifier,
          name: context.tenant.name,
          data: context.tenant.data,
        },
      }),
    };

    return `User's content requirements: "${contentPrompt}"

Event information:
- Event Name: ${eventName}
- Event Context: ${JSON.stringify(eventContext, null, 2)}

Full context:
${JSON.stringify(contextInfo, null, 2)}

Based on the user's content requirements and the event information above, generate a personalized email with subject and body that fulfills their specific needs.`;
  }

  @Instrument()
  private parseAIResponse(response: string): GeneratedEmailContent {
    try {
      const cleanResponse = response.trim();

      let jsonResponse;
      if (cleanResponse.startsWith('{') && cleanResponse.endsWith('}')) {
        jsonResponse = JSON.parse(cleanResponse);
      } else {
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      }

      if (typeof jsonResponse.subject !== 'string' || typeof jsonResponse.body !== 'string') {
        throw new Error('Invalid response format');
      }

      return {
        subject: jsonResponse.subject || 'Notification Alert',
        body: jsonResponse.body || 'You have a new notification.',
        success: jsonResponse.success === true,
        reason: jsonResponse.reason || 'Generated successfully',
      };
    } catch (error) {
      this.logger.warn('Failed to parse AI response, using fallback content', { response, error });

      return {
        subject: 'Notification Alert',
        body: '<p>You have a new notification that matches your custom preferences.</p>',
        success: false,
        reason: 'Failed to parse AI response, using fallback content',
      };
    }
  }
}
