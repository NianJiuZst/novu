import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@novu/application-generic';
import { NotificationStepEntity, NotificationTemplateRepository } from '@novu/dal';

@Injectable()
export class StepTemplateFetcher {
  constructor(
    private notificationTemplateRepository: NotificationTemplateRepository,
    private logger: PinoLogger
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async fetchStepTemplate(params: {
    workflowId: string;
    stepId: string;
    environmentId: string;
  }): Promise<NotificationStepEntity | null> {
    const { workflowId, stepId, environmentId } = params;
    const workflow = await this.notificationTemplateRepository.findById(workflowId, environmentId);

    if (!workflow) {
      this.logger.warn(`Workflow not found: ${workflowId}`);

      return null;
    }

    const step = this.findStepByStepId(workflow.steps, stepId);
    if (!step) {
      this.logger.warn(`Step not found: ${stepId} in workflow ${workflowId}`);

      return null;
    }

    return step;
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
