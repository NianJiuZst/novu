import { BadRequestException, Injectable } from '@nestjs/common';
import { ControlValuesLevelEnum, ShortIsPrefixEnum, ResourceOriginEnum } from '@novu/shared';
import { ControlValuesRepository, NotificationStepEntity, NotificationTemplateEntity } from '@novu/dal';
import { GetWorkflowByIdsUseCase, Instrument, InstrumentUsecase } from '@novu/application-generic';

import { BuildStepDataCommand } from './build-step-data.command';
import { InvalidStepException } from '../../exceptions/invalid-step.exception';
import { BuildVariableSchemaUsecase } from '../build-variable-schema';
import { buildSlug } from '../../../shared/helpers/build-slug';
import { StepResponseDto } from '../../dtos';

@Injectable()
export class BuildStepDataUsecase {
  constructor(
    private getWorkflowByIdsUseCase: GetWorkflowByIdsUseCase,
    private controlValuesRepository: ControlValuesRepository,
    private buildAvailableVariableSchemaUsecase: BuildVariableSchemaUsecase
  ) {}

  @InstrumentUsecase()
  async execute(command: BuildStepDataCommand): Promise<StepResponseDto> {
    const workflow = await this.fetchWorkflow(command);

    const currentStep: NotificationStepEntity | undefined = await this.loadStepsFromDb(command, workflow);
    if (!currentStep || !currentStep._templateId || currentStep.stepId === undefined || !currentStep?.template?.type) {
      throw new InvalidStepException(command.stepIdOrInternalId);
    }
    const controlValues = await this.getControlValues(command, currentStep, workflow._id);
    const stepName = currentStep.name || 'MISSING STEP NAME - PLEASE UPDATE IMMEDIATELY';
    const variables = await this.buildAvailableVariableSchema(command, currentStep, workflow);

    const slug = buildSlug(stepName, ShortIsPrefixEnum.STEP, currentStep._templateId);

    return {
      controls: {
        dataSchema: currentStep.template?.controls?.schema,
        uiSchema: currentStep.template?.controls?.uiSchema,
        values: controlValues,
      },
      controlValues,
      variables,
      name: stepName,
      slug,
      _id: currentStep._templateId,
      stepId: currentStep.stepId || 'Missing Step Id',
      type: currentStep.template?.type,
      origin: workflow.origin || ResourceOriginEnum.EXTERNAL,
      workflowId: workflow.triggers[0].identifier,
      workflowDatabaseId: workflow._id,
      issues: currentStep.issues,
    } as StepResponseDto;
  }

  /**
   * Bulk fetch control values for multiple steps in a workflow to optimize sync operations
   */
  public async bulkFetchControlValues(
    workflowId: string,
    stepIds: string[],
    environmentId: string,
    organizationId: string
  ): Promise<Map<string, Record<string, unknown>>> {
    if (stepIds.length === 0) {
      return new Map();
    }

    const controlValuesMap = new Map<string, Record<string, unknown>>();

    const controlValuesEntities = await this.controlValuesRepository.find({
      _environmentId: environmentId,
      _organizationId: organizationId,
      _workflowId: workflowId,
      _stepId: { $in: stepIds },
      level: ControlValuesLevelEnum.STEP_CONTROLS,
    });

    // Map the results back to step IDs
    for (const entity of controlValuesEntities) {
      if (entity._stepId) {
        controlValuesMap.set(entity._stepId, entity.controls || {});
      }
    }

    // Ensure all requested step IDs have an entry (even if empty)
    for (const stepId of stepIds) {
      if (!controlValuesMap.has(stepId)) {
        controlValuesMap.set(stepId, {});
      }
    }

    return controlValuesMap;
  }

  /**
   * Bulk fetch control values for multiple workflows to optimize sync operations.
   * This method batches control values fetching across all workflows and steps at once.
   */
  public async bulkFetchControlValuesForAllWorkflows(
    workflows: Array<{ workflowId: string; stepIds: string[]; environmentId: string; organizationId: string }>
  ): Promise<Map<string, Map<string, Record<string, unknown>>>> {
    if (workflows.length === 0) {
      return new Map();
    }

    const resultMap = new Map<string, Map<string, Record<string, unknown>>>();

    // Group workflows by environment and organization for bulk fetching
    const workflowsByEnvAndOrg = new Map<string, typeof workflows>();
    for (const workflow of workflows) {
      const key = `${workflow.environmentId}:${workflow.organizationId}`;
      if (!workflowsByEnvAndOrg.has(key)) {
        workflowsByEnvAndOrg.set(key, []);
      }
      workflowsByEnvAndOrg.get(key)!.push(workflow);
    }

    // Process each environment-organization group
    for (const [envOrgKey, envWorkflows] of workflowsByEnvAndOrg.entries()) {
      const [environmentId, organizationId] = envOrgKey.split(':');

      // Collect all workflow IDs and step IDs for this environment
      const allWorkflowIds = envWorkflows.map((workflow) => workflow.workflowId);
      const allStepIds = envWorkflows.flatMap((workflow) => workflow.stepIds);

      if (allStepIds.length === 0) {
        // Initialize empty maps for workflows with no steps
        for (const workflow of envWorkflows) {
          resultMap.set(workflow.workflowId, new Map());
        }
        continue;
      }

      // Fetch all control values for this environment in one query
      const controlValuesEntities = await this.controlValuesRepository.find({
        _environmentId: environmentId,
        _organizationId: organizationId,
        _workflowId: { $in: allWorkflowIds },
        _stepId: { $in: allStepIds },
        level: ControlValuesLevelEnum.STEP_CONTROLS,
      });

      // Initialize result maps for each workflow
      for (const workflow of envWorkflows) {
        resultMap.set(workflow.workflowId, new Map());
      }

      // Group results by workflow and step
      for (const entity of controlValuesEntities) {
        if (entity._workflowId && entity._stepId) {
          const workflowMap = resultMap.get(entity._workflowId);
          if (workflowMap) {
            workflowMap.set(entity._stepId, entity.controls || {});
          }
        }
      }

      // Ensure all requested step IDs have an entry (even if empty)
      for (const workflow of envWorkflows) {
        const workflowMap = resultMap.get(workflow.workflowId);
        if (workflowMap) {
          for (const stepId of workflow.stepIds) {
            if (!workflowMap.has(stepId)) {
              workflowMap.set(stepId, {});
            }
          }
        }
      }
    }

    return resultMap;
  }

  private async buildAvailableVariableSchema(
    command: BuildStepDataCommand,
    currentStep: NotificationStepEntity,
    workflow: NotificationTemplateEntity
  ) {
    return await this.buildAvailableVariableSchemaUsecase.execute({
      environmentId: command.user.environmentId,
      organizationId: command.user.organizationId,
      userId: command.user._id,
      stepInternalId: currentStep._templateId,
      workflow,
    });
  }

  @Instrument()
  private async fetchWorkflow(command: BuildStepDataCommand) {
    return await this.getWorkflowByIdsUseCase.execute({
      workflowIdOrInternalId: command.workflowIdOrInternalId,
      environmentId: command.user.environmentId,
      organizationId: command.user.organizationId,
    });
  }

  @Instrument()
  private async getControlValues(
    command: BuildStepDataCommand,
    currentStep: NotificationStepEntity,
    _workflowId: string
  ) {
    const controlValuesEntity = await this.controlValuesRepository.findOne({
      _environmentId: command.user.environmentId,
      _organizationId: command.user.organizationId,
      _workflowId,
      _stepId: currentStep._templateId,
      level: ControlValuesLevelEnum.STEP_CONTROLS,
    });

    return controlValuesEntity?.controls || {};
  }

  @Instrument()
  private async loadStepsFromDb(
    command: BuildStepDataCommand,
    workflow: NotificationTemplateEntity
  ): Promise<NotificationStepEntity | undefined> {
    const currentStep: NotificationStepEntity | undefined = workflow.steps.find(
      (stepItem) => stepItem._id === command.stepIdOrInternalId || stepItem.stepId === command.stepIdOrInternalId
    );

    if (!currentStep) {
      throw new BadRequestException({
        message: 'No step found',
        stepId: command.stepIdOrInternalId,
        workflowId: command.workflowIdOrInternalId,
      });
    }

    return currentStep;
  }
}
