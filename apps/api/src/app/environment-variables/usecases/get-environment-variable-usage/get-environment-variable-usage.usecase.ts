import { Injectable, NotFoundException } from '@nestjs/common';
import { InstrumentUsecase } from '@novu/application-generic';
import { ControlValuesRepository, EnvironmentVariableRepository, NotificationTemplateRepository } from '@novu/dal';
import { ControlValuesLevelEnum } from '@novu/shared';
import {
  EnvironmentVariableWorkflowInfoDto,
  GetEnvironmentVariableUsageResponseDto,
} from '../../dtos/get-environment-variable-usage-response.dto';
import { GetEnvironmentVariableUsageCommand } from './get-environment-variable-usage.command';

@Injectable()
export class GetEnvironmentVariableUsage {
  constructor(
    private environmentVariableRepository: EnvironmentVariableRepository,
    private controlValuesRepository: ControlValuesRepository,
    private notificationTemplateRepository: NotificationTemplateRepository
  ) {}

  @InstrumentUsecase()
  async execute(command: GetEnvironmentVariableUsageCommand): Promise<GetEnvironmentVariableUsageResponseDto> {
    const variable = await this.environmentVariableRepository.findById(
      { _id: command.variableId, _organizationId: command.organizationId },
      '*'
    );

    if (!variable) {
      throw new NotFoundException(`Environment variable with id ${command.variableId} not found`);
    }

    const controlValues = await this.controlValuesRepository.findMany({
      _organizationId: command.organizationId,
      level: ControlValuesLevelEnum.STEP_CONTROLS,
    });

    const envVarPattern = `env.${variable.key}`;
    const referencingControlValues = controlValues.filter((cv) => JSON.stringify(cv.controls).includes(envVarPattern));

    const workflowEnvironmentMap = new Map<string, string>();

    for (const cv of referencingControlValues) {
      if (cv._workflowId && cv._environmentId && !workflowEnvironmentMap.has(cv._workflowId)) {
        workflowEnvironmentMap.set(cv._workflowId, cv._environmentId);
      }
    }

    const workflows: EnvironmentVariableWorkflowInfoDto[] = [];

    for (const [workflowId, environmentId] of workflowEnvironmentMap) {
      try {
        const workflow = await this.notificationTemplateRepository.findById(workflowId, environmentId);

        if (workflow?.triggers && workflow.triggers.length > 0) {
          workflows.push({
            name: workflow.name,
            workflowId: workflow.triggers[0].identifier,
          });
        }
      } catch (error) {}
    }

    return { workflows };
  }
}
