import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

import { IFilterVariables, Instrument, InstrumentUsecase } from '@novu/application-generic';

export interface AIEvaluationCommand {
  prompt: string;
  context: IFilterVariables;
  workflowName?: string;
  stepType?: string;
}

export interface AIEvaluationResult {
  shouldSend: boolean;
  reason: string;
}

@Injectable()
export class EvaluateAIPreference {
  private readonly logger = new Logger(EvaluateAIPreference.name);

  @InstrumentUsecase()
  public async execute(command: AIEvaluationCommand): Promise<AIEvaluationResult> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(command);

      const result = await generateText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.1,
        maxTokens: 200,
      });

      return this.parseAIResponse(result.text);
    } catch (error) {
      console.log(error, '!!!');
      this.logger.error('Failed to evaluate AI preference', error);

      return {
        shouldSend: true,
        reason: 'AI evaluation failed, defaulting to send notification',
      };
    }
  }

  private buildSystemPrompt(): string {
    return `You are an AI assistant that helps users decide whether they should receive a notification based on their custom preferences.

Your task is to analyze the notification context against the user's preference prompt and determine if the notification should be sent.

You must respond with a JSON object containing:
- "shouldSend": boolean (true if the notification matches the user's preferences, false otherwise)
- "reason": string (brief explanation of why you made this decision)

Be strict in following the user's preferences. If the user's prompt is vague, err on the side of sending the notification.

Example response:
{
  "shouldSend": true,
  "reason": "The notification is about a high-priority issue which matches the user's preference for urgent matters"
}`;
  }

  private buildUserPrompt(command: AIEvaluationCommand): string {
    const { prompt, context, workflowName, stepType } = command;

    const contextInfo = {
      workflowName: workflowName || 'Unknown Workflow',
      stepType: stepType || 'Unknown Step',
      subscriber: {
        subscriberId: context.subscriber?.subscriberId,
        email: context.subscriber?.email,
        firstName: context.subscriber?.firstName,
        lastName: context.subscriber?.lastName,
      },
      payload: context.payload,
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

    return `User's preference: "${prompt}"

Notification context:
${JSON.stringify(contextInfo, null, 2)}

Based on the user's preference and the notification context above, should this notification be sent?`;
  }

  @Instrument()
  private parseAIResponse(response: string): AIEvaluationResult {
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

      if (typeof jsonResponse.shouldSend !== 'boolean') {
        throw new Error('Invalid shouldSend value');
      }

      if (typeof jsonResponse.reason !== 'string') {
        throw new Error('Invalid reason value');
      }

      return {
        shouldSend: jsonResponse.shouldSend,
        reason: jsonResponse.reason,
      };
    } catch (error) {
      this.logger.warn('Failed to parse AI response, defaulting to send', { response, error });

      return {
        shouldSend: true,
        reason: 'Failed to parse AI response, defaulting to send notification',
      };
    }
  }
}
