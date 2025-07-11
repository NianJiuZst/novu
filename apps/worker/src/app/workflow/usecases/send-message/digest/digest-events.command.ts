import { BaseCommand } from '@novu/application-generic';
import type { JobEntity } from '@novu/dal';
import { IsDefined } from 'class-validator';

export class DigestEventsCommand extends BaseCommand {
  @IsDefined()
  _subscriberId: string;

  @IsDefined()
  currentJob: JobEntity;
}
