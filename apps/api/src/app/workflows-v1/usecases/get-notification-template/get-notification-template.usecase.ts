import { Injectable } from '@nestjs/common';
import { GetWorkflowByIdsCommand } from '@novu/application-generic';
import type { NotificationTemplateEntity } from '@novu/dal';
import type { GetWorkflowWithPreferencesUseCase } from '../get-workflow-with-preferences/get-workflow-with-preferences.usecase';
import type { GetNotificationTemplateCommand } from './get-notification-template.command';

/**
 * @deprecated
 * This usecase is deprecated and will be removed in the future.
 * Please use the GetWorkflow usecase instead.
 */
@Injectable()
export class GetNotificationTemplate {
  constructor(private getWorkflowWithPreferencesUseCase: GetWorkflowWithPreferencesUseCase) {}

  async execute(command: GetNotificationTemplateCommand): Promise<NotificationTemplateEntity> {
    const workflow = await this.getWorkflowWithPreferencesUseCase.execute(
      GetWorkflowByIdsCommand.create({
        workflowIdOrInternalId: command.workflowIdOrIdentifier,
        environmentId: command.environmentId,
        organizationId: command.organizationId,
      })
    );

    return workflow;
  }
}
