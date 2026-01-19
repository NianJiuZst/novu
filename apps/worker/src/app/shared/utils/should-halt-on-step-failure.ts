import { isActionStepType } from '@novu/application-generic';
import { JobEntity, NotificationStepEntity } from '@novu/dal';

/**
 * Determines if the workflow should halt on step failure.
 *
 * @param job - The job entity
 * @param step - Optional resolved step entity (if not provided, falls back to job.step)
 * @returns True if the workflow should halt on step failure
 */
export const shouldHaltOnStepFailure = (job: JobEntity, step?: NotificationStepEntity): boolean => {
  const resolvedStep = step || job.step;

  if (!job.type) {
    return resolvedStep?.shouldStopOnFail === true;
  }

  /*
   * Action steps always stop on failure across all versions (v1 & v2)
   */
  if (isActionStepType(job.type)) {
    return true;
  }

  /*
   * Legacy v1 behavior:
   * Return true if shouldStopOnFail was explicitly enabled by user
   */
  return resolvedStep?.shouldStopOnFail === true;
};
