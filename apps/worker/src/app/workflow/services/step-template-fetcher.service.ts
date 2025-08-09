import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@novu/application-generic';
import {
  MessageTemplateEntity,
  MessageTemplateRepository,
  NotificationStepEntity,
  NotificationTemplateRepository,
} from '@novu/dal';

export interface StepTemplateResult {
  template: MessageTemplateEntity;
  step: NotificationStepEntity;
}

@Injectable()
export class StepTemplateFetcher {
  constructor(
    private notificationTemplateRepository: NotificationTemplateRepository,
    private messageTemplateRepository: MessageTemplateRepository,
    private logger: PinoLogger
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async fetchStepTemplate(params: {
    workflowId: string;
    stepId: string;
    environmentId: string;
  }): Promise<StepTemplateResult | null> {
    const { workflowId, stepId, environmentId } = params;

    try {
      const workflow = await this.notificationTemplateRepository.findOne(
        {
          _id: workflowId,
          _environmentId: environmentId,
        },
        'steps'
      );

      if (!workflow) {
        this.logger.warn(`Workflow not found: ${workflowId}`);

        return null;
      }

      const step = this.findStepByStepId(workflow.steps, stepId);
      if (!step) {
        this.logger.warn(`Step not found: ${stepId} in workflow ${workflowId}`);

        return null;
      }

      const template = await this.messageTemplateRepository.findOne({
        _id: step._templateId,
        _environmentId: environmentId,
      });

      if (!template) {
        this.logger.warn(`Template not found: ${step._templateId}`);

        return null;
      }

      return {
        template,
        step,
      };
    } catch (error) {
      this.logger.error(`Error fetching step template for workflow ${workflowId}, step ${stepId}:`, error);

      return null;
    }
  }

  async fetchStepTemplateByMessageTemplateId(params: {
    messageTemplateId: string;
    environmentId: string;
  }): Promise<MessageTemplateEntity | null> {
    const { messageTemplateId, environmentId } = params;

    try {
      const template = await this.messageTemplateRepository.findOne({
        _id: messageTemplateId,
        _environmentId: environmentId,
      });

      if (!template) {
        this.logger.warn(`Template not found: ${messageTemplateId}`);

        return null;
      }

      return template;
    } catch (error) {
      this.logger.error(`Error fetching template ${messageTemplateId}:`, error);

      return null;
    }
  }

  private findStepByStepId(steps: NotificationStepEntity[], stepId: string): NotificationStepEntity | null {
    for (const step of steps) {
      if (step._id?.toString() === String(stepId)) {
        return step;
      }

      if (step.variants) {
        for (const variant of step.variants) {
          if (variant._id === stepId) {
            return variant;
          }
        }
      }
    }

    return null;
  }
}
