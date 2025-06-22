import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

import { IFilterVariables, Instrument, InstrumentUsecase } from '@novu/application-generic';
import { CustomNotificationsRepository, CustomNotificationEntity } from '@novu/dal';

export interface CustomNotificationEvaluationCommand {
  environmentId: string;
  organizationId: string;
  subscriberId: string;
  eventName: string;
  eventContext: Record<string, any>;
  context: IFilterVariables;
}

export interface CustomNotificationMatch {
  notification: CustomNotificationEntity;
  shouldSend: boolean;
  reason: string;
}

export interface CustomNotificationEvaluationResult {
  matches: CustomNotificationMatch[];
  shouldSend: boolean;
  totalMatches: number;
}

@Injectable()
export class EvaluateCustomNotifications {
  private readonly logger = new Logger(EvaluateCustomNotifications.name);

  constructor(private customNotificationsRepository: CustomNotificationsRepository) {}

  @InstrumentUsecase()
  public async execute(command: CustomNotificationEvaluationCommand): Promise<CustomNotificationEvaluationResult> {
    try {
      // Fetch all enabled custom notifications for the subscriber
      const customNotifications = await this.customNotificationsRepository.findBySubscriberId(
        command.environmentId,
        command.organizationId,
        command.subscriberId
      );

      const enabledNotifications = customNotifications.filter((notification) => notification.enabled);

      if (enabledNotifications.length === 0) {
        return {
          matches: [],
          shouldSend: false,
          totalMatches: 0,
        };
      }

      // Evaluate each custom notification
      const matches: CustomNotificationMatch[] = [];

      for (const notification of enabledNotifications) {
        try {
          const evaluationResult = await this.evaluateNotification(notification, command);
          matches.push({
            notification,
            shouldSend: evaluationResult.shouldSend,
            reason: evaluationResult.reason,
          });
        } catch (error) {
          this.logger.error(`Failed to evaluate custom notification ${notification._id}`, error);
          // Default to not sending if evaluation fails
          matches.push({
            notification,
            shouldSend: false,
            reason: 'Evaluation failed, defaulting to not send',
          });
        }
      }

      const shouldSendMatches = matches.filter((match) => match.shouldSend);

      return {
        matches,
        shouldSend: shouldSendMatches.length > 0,
        totalMatches: shouldSendMatches.length,
      };
    } catch (error) {
      this.logger.error('Failed to evaluate custom notifications', error);

      return {
        matches: [],
        shouldSend: false,
        totalMatches: 0,
      };
    }
  }

  @Instrument()
  private async evaluateNotification(
    notification: CustomNotificationEntity,
    command: CustomNotificationEvaluationCommand
  ): Promise<{ shouldSend: boolean; reason: string }> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(notification.query, command);

    console.log(systemPrompt, userPrompt, '!!!');
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.1,
      maxTokens: 200,
    });

    return this.parseAIResponse(result.text);
  }

  private buildSystemPrompt(): string {
    return `You are an AI assistant that helps evaluate whether a custom notification rule should trigger based on an event.

Your task is to analyze the event information against the user's custom notification rule and determine if the notification should be sent.

The user has created a custom notification rule with a specific query/prompt describing what they want to be notified about. You need to check if the current event matches their criteria.

You must respond with a JSON object containing:
- "shouldSend": boolean (true if the event matches the user's notification rule, false otherwise)
- "reason": string (brief explanation of why you made this decision)

Be precise in matching the user's criteria. If the user's rule is vague, err on the side of caution and don't send unless there's a clear match.

Example response:
{
  "shouldSend": true,
  "reason": "The event matches the user's rule for high-priority security alerts"
}`;
  }

  private buildUserPrompt(userQuery: string, command: CustomNotificationEvaluationCommand): string {
    const { eventName, eventContext, context } = command;

    const eventInfo = {
      eventName,
      eventContext,
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

    return `User's custom notification rule: "${userQuery}"

Event information:
- Event Name: ${eventName}
- Event Context: ${JSON.stringify(eventContext, null, 2)}

Full context:
${JSON.stringify(eventInfo, null, 2)}

Based on the user's custom notification rule and the event information above, should this notification be sent?`;
  }

  @Instrument()
  private parseAIResponse(response: string): { shouldSend: boolean; reason: string } {
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
      this.logger.warn('Failed to parse AI response, defaulting to not send', { response, error });

      return {
        shouldSend: false,
        reason: 'Failed to parse AI response, defaulting to not send notification',
      };
    }
  }
}
