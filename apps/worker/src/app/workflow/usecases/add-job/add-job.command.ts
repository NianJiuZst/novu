import { EnvironmentWithUserCommand } from '@novu/application-generic';
import type { JobEntity } from '@novu/dal';
import type { StatelessControls } from '@novu/shared';
import { IsDefined } from 'class-validator';

export class AddJobCommand extends EnvironmentWithUserCommand {
  @IsDefined()
  jobId: string;

  @IsDefined()
  job: JobEntity;

  controls?: StatelessControls;
}
