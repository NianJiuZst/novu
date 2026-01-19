import { JobEntity, NotificationStepEntity, NotificationTemplateEntity } from '@novu/dal';

/**
 * Resolves the step entity from the workflow template using job's step reference fields.
 *
 * This function supports both the new minimal step reference approach (using _stepId/stepId)
 * and backward compatibility with the deprecated step field.
 *
 * Priority:
 * 1. job._stepId - Reference to step._id in workflow
 * 2. job.step?._id - Fallback for backward compatibility
 *
 * @param workflow - The notification template entity containing workflow steps
 * @param job - The job entity containing step reference fields
 * @returns The resolved NotificationStepEntity or undefined if not found
 */
export function resolveStepFromWorkflow(
  workflow: NotificationTemplateEntity | undefined,
  job: JobEntity
): NotificationStepEntity | undefined {
  if (!workflow?.steps) {
    return undefined;
  }

  return workflow.steps.find((step) => step._id === job._stepId || step._id === job.step?._id);
}

/**
 * Gets the step ID from a job, preferring the new minimal reference fields.
 *
 * @param job - The job entity
 * @returns The step ID or undefined
 */
export function getStepIdFromJob(job: JobEntity): string | undefined {
  return job._stepId || job.step?._id;
}

/**
 * Gets the human-readable step identifier from a job.
 *
 * @param job - The job entity
 * @returns The step identifier or undefined
 */
export function getStepIdentifierFromJob(job: JobEntity): string | undefined {
  return job.stepId || job.step?.stepId;
}

/**
 * Checks if a job is a stateless bridge workflow by checking for bridgeUrl.
 *
 * @param job - The job entity
 * @returns True if the job is from a stateless bridge workflow
 */
export function isStatelessBridgeJob(job: JobEntity): boolean {
  return !!(job.bridgeUrl || job.step?.bridgeUrl);
}

/**
 * Gets the bridge URL from a job, preferring the new minimal reference field.
 *
 * @param job - The job entity
 * @returns The bridge URL or undefined
 */
export function getBridgeUrlFromJob(job: JobEntity): string | undefined {
  return job.bridgeUrl || job.step?.bridgeUrl;
}
