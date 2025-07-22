import { Injectable } from '@nestjs/common';
import { NotificationTemplateEntity } from '@novu/dal';
import { UserSessionData } from '@novu/shared';
import { IBaseComparator } from '../base/interfaces/base-comparator.interface';
import { IResourceDiff } from '../../../types/sync.types';
import { WorkflowComparator } from '../comparators/workflow.comparator';

@Injectable()
export class WorkflowComparatorAdapter implements IBaseComparator<NotificationTemplateEntity> {
  constructor(private readonly workflowComparator: WorkflowComparator) {}

  async compareResources(
    sourceResource: NotificationTemplateEntity,
    targetResource: NotificationTemplateEntity,
    userContext: UserSessionData
  ): Promise<{
    resourceChanges: {
      previous: Record<string, any> | null;
      new: Record<string, any> | null;
    } | null;
    otherDiffs?: IResourceDiff[];
  }> {
    const { workflowChanges, otherDiffs } = await this.workflowComparator.compareWorkflows(
      sourceResource,
      targetResource,
      userContext
    );

    return {
      resourceChanges: workflowChanges,
      otherDiffs,
    };
  }

  /**
   * Compare resources with pre-fetched preferences to avoid individual preference fetching
   */
  async compareResourcesWithPreferences(
    sourceResource: NotificationTemplateEntity,
    targetResource: NotificationTemplateEntity,
    userContext: UserSessionData,
    sourcePreferences?: any,
    targetPreferences?: any
  ): Promise<{
    resourceChanges: {
      previous: Record<string, any> | null;
      new: Record<string, any> | null;
    } | null;
    otherDiffs?: IResourceDiff[];
  }> {
    const { workflowChanges, otherDiffs } = await this.workflowComparator.compareWorkflows(
      sourceResource,
      targetResource,
      userContext,
      sourcePreferences,
      targetPreferences
    );

    return {
      resourceChanges: workflowChanges,
      otherDiffs,
    };
  }

  /**
   * Bulk compare multiple workflows with optimized preference and control values fetching
   */
  async bulkCompareResources(
    sourceResources: NotificationTemplateEntity[],
    targetResources: NotificationTemplateEntity[],
    userContext: UserSessionData
  ): Promise<
    Map<
      string,
      {
        resourceChanges: {
          previous: Record<string, any> | null;
          new: Record<string, any> | null;
        } | null;
        otherDiffs?: IResourceDiff[];
      }
    >
  > {
    const comparisonResults = await this.workflowComparator.bulkCompareWorkflows(
      sourceResources,
      targetResources,
      userContext
    );

    // Transform the results to match the expected format
    const adaptedResults = new Map<
      string,
      {
        resourceChanges: {
          previous: Record<string, any> | null;
          new: Record<string, any> | null;
        } | null;
        otherDiffs?: IResourceDiff[];
      }
    >();

    for (const [workflowId, comparison] of comparisonResults.entries()) {
      adaptedResults.set(workflowId, {
        resourceChanges: comparison.workflowChanges,
        otherDiffs: comparison.otherDiffs,
      });
    }

    return adaptedResults;
  }
}
