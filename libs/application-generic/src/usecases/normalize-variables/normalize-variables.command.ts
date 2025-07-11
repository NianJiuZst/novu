import type { JobEntity, NotificationStepEntity, StepFilter } from '@novu/dal';
import { IsDefined } from 'class-validator';

import { EnvironmentWithUserCommand } from '../../commands';
import type { IFilterVariables } from '../../utils';

export class NormalizeVariablesCommand extends EnvironmentWithUserCommand {
  @IsDefined()
  filters: StepFilter[];

  job?: JobEntity;

  step?: NotificationStepEntity;

  variables?: IFilterVariables;
}
