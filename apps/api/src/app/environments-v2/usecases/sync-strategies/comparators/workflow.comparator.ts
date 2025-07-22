import { Injectable } from '@nestjs/common';
import { Instrument, PinoLogger, GetPreferences } from '@novu/application-generic';
import { diff } from 'deep-object-diff';
import { UserSessionData, DEFAULT_WORKFLOW_PREFERENCES } from '@novu/shared';
import { LocalizationResourceEnum, NotificationTemplateEntity } from '@novu/dal';
import { ModuleRef } from '@nestjs/core';
import { IWorkflowComparison, INormalizedStep, INormalizedWorkflow } from '../types/workflow-sync.types';
import { IResourceDiff, DiffActionEnum, ResourceTypeEnum } from '../../../types/sync.types';
import { WorkflowRepositoryService } from '../operations/workflow-repository.service';

@Injectable()
export class WorkflowComparator {
  constructor(
    private logger: PinoLogger,
    private workflowRepositoryService: WorkflowRepositoryService,
    private getPreferences: GetPreferences,
    private moduleRef: ModuleRef
  ) {}

  /**
   * Bulk compare multiple workflows with optimized preference fetching
   */
  async bulkCompareWorkflows(
    sourceWorkflows: NotificationTemplateEntity[],
    targetWorkflows: NotificationTemplateEntity[],
    userContext: UserSessionData
  ): Promise<Map<string, IWorkflowComparison>> {
    const results = new Map<string, IWorkflowComparison>();

    if (sourceWorkflows.length === 0) {
      return results;
    }

    try {
      // Fetch preferences for all workflows in bulk
      const [sourcePreferencesMap, targetPreferencesMap] = await Promise.all([
        this.bulkFetchPreferences(sourceWorkflows),
        this.bulkFetchPreferences(targetWorkflows),
      ]);

      // Create workflow maps for easy lookup
      const targetWorkflowMap = new Map(
        targetWorkflows.map((workflow) => [this.workflowRepositoryService.getWorkflowIdentifier(workflow), workflow])
      );

      // Compare each source workflow with its target counterpart
      for (const sourceWorkflow of sourceWorkflows) {
        const workflowId = this.workflowRepositoryService.getWorkflowIdentifier(sourceWorkflow);
        const targetWorkflow = targetWorkflowMap.get(workflowId);

        if (targetWorkflow) {
          const sourcePreferences = sourcePreferencesMap.get(sourceWorkflow._id);
          const targetPreferences = targetPreferencesMap.get(targetWorkflow._id);

          if (!sourcePreferences) {
            throw new Error(`No preferences found for source workflow: ${sourceWorkflow._id}`);
          }
          if (!targetPreferences) {
            throw new Error(`No preferences found for target workflow: ${targetWorkflow._id}`);
          }

          const comparison = await this.compareWorkflowsWithPreferences(
            sourceWorkflow,
            targetWorkflow,
            sourcePreferences,
            targetPreferences,
            userContext
          );

          results.set(workflowId, comparison);
        }
      }

      return results;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to bulk compare workflows: ${error.message}`);
      throw error;
    }
  }

  async compareWorkflows(
    sourceWorkflow: NotificationTemplateEntity,
    targetWorkflow: NotificationTemplateEntity,
    userContext: UserSessionData
  ): Promise<IWorkflowComparison> {
    try {
      if (!sourceWorkflow || !targetWorkflow) {
        throw new Error('Source and target workflows must not be null');
      }

      // Fetch preferences for both workflows to ensure proper comparison
      const [sourcePreferencesMap, targetPreferencesMap] = await Promise.all([
        this.bulkFetchPreferences([sourceWorkflow]),
        this.bulkFetchPreferences([targetWorkflow]),
      ]);

      const sourcePreferences = sourcePreferencesMap.get(sourceWorkflow._id);
      const targetPreferences = targetPreferencesMap.get(targetWorkflow._id);

      if (!sourcePreferences) {
        throw new Error(`No preferences found for source workflow: ${sourceWorkflow._id}`);
      }
      if (!targetPreferences) {
        throw new Error(`No preferences found for target workflow: ${targetWorkflow._id}`);
      }

      return this.compareWorkflowsWithPreferences(
        sourceWorkflow,
        targetWorkflow,
        sourcePreferences,
        targetPreferences,
        userContext
      );
    } catch (error) {
      this.logger.error({ err: error }, `Failed to compare workflows ${error.message}`);

      return { workflowChanges: null, otherDiffs: [] };
    }
  }

  /**
   * Core workflow comparison logic with pre-fetched preferences
   */
  private async compareWorkflowsWithPreferences(
    sourceWorkflow: NotificationTemplateEntity,
    targetWorkflow: NotificationTemplateEntity,
    sourcePreferences: any,
    targetPreferences: any,
    userContext: UserSessionData
  ): Promise<IWorkflowComparison> {
    // Use direct entity normalization with proper preferences
    const normalizedSource = this.normalizeWorkflowEntity(sourceWorkflow, sourcePreferences);
    const normalizedTarget = this.normalizeWorkflowEntity(targetWorkflow, targetPreferences);

    // Separate steps from workflow fields
    const { steps: sourceSteps, ...sourceWithoutSteps } = normalizedSource;
    const { steps: targetSteps, ...targetWithoutSteps } = normalizedTarget;

    const workflowDifferences = diff(targetWithoutSteps, sourceWithoutSteps);

    let workflowChanges: {
      previous: Partial<INormalizedWorkflow> | null;
      new: Partial<INormalizedWorkflow> | null;
    } | null = null;

    if (Object.keys(workflowDifferences).length > 0) {
      workflowChanges = {
        previous: targetWithoutSteps,
        new: sourceWithoutSteps,
      };
    }

    // Compare steps and generate step-level diffs
    const stepDiffs = this.compareStepsAsEntities(sourceSteps, targetSteps);

    // Get localization group diffs for this workflow
    const localizationDiffs = await this.getLocalizationDiffs(sourceWorkflow, targetWorkflow, userContext._id);

    return { workflowChanges, otherDiffs: [...stepDiffs, ...localizationDiffs] };
  }

  /**
   * Bulk fetch preferences for multiple workflows
   */
  private async bulkFetchPreferences(workflows: NotificationTemplateEntity[]): Promise<Map<string, any>> {
    const preferencesMap = new Map<string, any>();

    if (workflows.length === 0) {
      return preferencesMap;
    }

    // Group workflows by environment for bulk fetching
    const workflowsByEnv = new Map<string, NotificationTemplateEntity[]>();
    for (const workflow of workflows) {
      const envId = workflow._environmentId;
      if (!workflowsByEnv.has(envId)) {
        workflowsByEnv.set(envId, []);
      }
      workflowsByEnv.get(envId)!.push(workflow);
    }

    // Fetch preferences for each environment in bulk
    for (const [envId, envWorkflows] of workflowsByEnv.entries()) {
      const templateIds = envWorkflows.map((workflow) => workflow._id);
      const orgId = envWorkflows[0]._organizationId;

      try {
        const bulkPreferences = await this.getPreferences.bulkFetchWorkflowPreferences(templateIds, envId, orgId);

        // Merge results into main map
        for (const [templateId, preferences] of bulkPreferences.entries()) {
          const foundWorkflow = envWorkflows.find((wf) => wf._id === templateId);
          if (!foundWorkflow) {
            throw new Error(`Workflow not found for template ID: ${templateId}`);
          }

          preferencesMap.set(templateId, this.buildPreferencesStructure(preferences, foundWorkflow));
        }
      } catch (error) {
        this.logger.error({ err: error }, `Failed to fetch preferences for environment ${envId}: ${error.message}`);
        throw error;
      }
    }

    return preferencesMap;
  }

  /**
   * Build preferences structure from bulk fetch result
   */
  private buildPreferencesStructure(preferences: any, workflow: NotificationTemplateEntity) {
    if (!preferences) {
      throw new Error(`No preferences found for workflow: ${workflow._id}`);
    }

    if (!workflow.name) {
      throw new Error(`Workflow name is required for: ${workflow._id}`);
    }

    return {
      user: preferences.user || null,
      default: preferences.default || DEFAULT_WORKFLOW_PREFERENCES,
    };
  }

  /**
   * Normalize workflow entity to a simplified structure for comparison
   */
  private normalizeWorkflowEntity(workflow: NotificationTemplateEntity, preferences: any): INormalizedWorkflow {
    return {
      workflowId: workflow.triggers?.[0]?.identifier || '',
      name: workflow.name,
      description: workflow.description,
      tags: workflow.tags || [],
      active: workflow.active,
      payloadSchema: workflow.payloadSchema ?? null,
      validatePayload: workflow.validatePayload,
      isTranslationEnabled: workflow.isTranslationEnabled,
      preferences,
      steps: workflow.steps?.map((step, index) => this.normalizeStepEntity(step, index)) || [],
    };
  }

  /**
   * Normalize step entity to a simplified structure for comparison
   */
  private normalizeStepEntity(step: any, index: number): INormalizedStep {
    return {
      stepId: step.stepId || step.uuid || step._id,
      name: step.name || `Step ${index + 1}`,
      type: step.template?.type || 'unknown',
      controlValues: {},
    };
  }

  @Instrument()
  private async getLocalizationDiffs(
    sourceWorkflow: NotificationTemplateEntity,
    targetWorkflow: NotificationTemplateEntity,
    userId: string
  ): Promise<IResourceDiff[]> {
    try {
      // Use the new DiffTranslationGroups use case from the translation module
      // eslint-disable-next-line global-require
      const diffTranslationGroups = this.moduleRef.get(require('@novu/ee-translation')?.DiffTranslationGroups, {
        strict: false,
      });

      if (!diffTranslationGroups) {
        this.logger.debug('Translation module not available, skipping localization diff');

        return [];
      }

      return await diffTranslationGroups.execute({
        sourceEnvironmentId: sourceWorkflow._environmentId,
        targetEnvironmentId: targetWorkflow._environmentId,
        resourceId: this.workflowRepositoryService.getWorkflowIdentifier(sourceWorkflow),
        resourceType: LocalizationResourceEnum.WORKFLOW,
        organizationId: sourceWorkflow._organizationId,
        userId,
        environmentId: sourceWorkflow._environmentId, // Required by EnvironmentWithUserCommand
      });
    } catch (error) {
      this.logger.error(`Failed to diff localization groups for workflow ${sourceWorkflow.name}`, error);

      return [];
    }
  }

  private compareStepsAsEntities(sourceSteps: INormalizedStep[], targetSteps: INormalizedStep[]): IResourceDiff[] {
    const stepDiffs: IResourceDiff[] = [];

    const targetStepMap = new Map(targetSteps.map((step, index) => [step.stepId, { step, index }]));

    const processedSteps = new Set<string>();

    sourceSteps.forEach((sourceStep, sourceIndex) => {
      const targetStepData = targetStepMap.get(sourceStep.stepId);

      if (!targetStepData) {
        stepDiffs.push(this.createStepAddedDiff(sourceStep, sourceIndex));
      } else {
        const { step: targetStep, index: targetIndex } = targetStepData;
        const stepChanges = this.compareIndividualStep(sourceStep, targetStep);

        if (stepChanges) {
          stepDiffs.push(this.createStepModifiedDiff(sourceStep, targetStep, sourceIndex, targetIndex, stepChanges));
        } else if (sourceIndex !== targetIndex) {
          stepDiffs.push(this.createStepMovedDiff(sourceStep, targetStep, sourceIndex, targetIndex));
        }
      }

      processedSteps.add(sourceStep.stepId);
    });

    targetSteps.forEach((targetStep, targetIndex) => {
      if (!processedSteps.has(targetStep.stepId)) {
        stepDiffs.push(this.createStepDeletedDiff(targetStep, targetIndex));
      }
    });

    return stepDiffs;
  }

  private compareIndividualStep(
    sourceStep: INormalizedStep,
    targetStep: INormalizedStep
  ): {
    previous: Partial<INormalizedStep> | null;
    new: Partial<INormalizedStep> | null;
  } | null {
    const differences = diff(targetStep, sourceStep);

    if (Object.keys(differences).length === 0) {
      return null;
    }

    return {
      previous: targetStep,
      new: sourceStep,
    };
  }

  private createStepAddedDiff(sourceStep: INormalizedStep, sourceIndex: number): IResourceDiff {
    return {
      sourceResource: {
        id: sourceStep.stepId,
        name: sourceStep.name,
        updatedBy: null,
        updatedAt: null,
      },
      targetResource: null,
      resourceType: ResourceTypeEnum.STEP,
      stepType: sourceStep.type,
      action: DiffActionEnum.ADDED,
      newIndex: sourceIndex,
      diffs: {
        previous: null,
        new: sourceStep,
      },
    };
  }

  private createStepModifiedDiff(
    sourceStep: INormalizedStep,
    targetStep: INormalizedStep,
    sourceIndex: number,
    targetIndex: number,
    stepChanges: {
      previous: Partial<INormalizedStep> | null;
      new: Partial<INormalizedStep> | null;
    }
  ): IResourceDiff {
    return {
      sourceResource: {
        id: sourceStep.stepId,
        name: sourceStep.name,
        updatedBy: null,
        updatedAt: null,
      },
      targetResource: {
        id: targetStep.stepId,
        name: targetStep.name,
        updatedBy: null,
        updatedAt: null,
      },
      resourceType: ResourceTypeEnum.STEP,
      stepType: sourceStep.type,
      action: DiffActionEnum.MODIFIED,
      previousIndex: targetIndex,
      newIndex: sourceIndex,
      diffs: stepChanges,
    };
  }

  private createStepMovedDiff(
    sourceStep: INormalizedStep,
    targetStep: INormalizedStep,
    sourceIndex: number,
    targetIndex: number
  ): IResourceDiff {
    return {
      sourceResource: {
        id: sourceStep.stepId,
        name: sourceStep.name,
        updatedBy: null,
        updatedAt: null,
      },
      targetResource: {
        id: targetStep.stepId,
        name: targetStep.name,
        updatedBy: null,
        updatedAt: null,
      },
      resourceType: ResourceTypeEnum.STEP,
      stepType: sourceStep.type,
      action: DiffActionEnum.MOVED,
      previousIndex: targetIndex,
      newIndex: sourceIndex,
    };
  }

  private createStepDeletedDiff(targetStep: INormalizedStep, targetIndex: number): IResourceDiff {
    return {
      sourceResource: null,
      targetResource: {
        id: targetStep.stepId,
        name: targetStep.name,
        updatedBy: null,
        updatedAt: null,
      },
      resourceType: ResourceTypeEnum.STEP,
      stepType: targetStep.type,
      action: DiffActionEnum.DELETED,
      previousIndex: targetIndex,
      diffs: {
        previous: targetStep,
        new: null,
      },
    };
  }
}
