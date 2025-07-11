import { EnvironmentWithUserCommand } from '@novu/application-generic';
import type { JobEntity, NotificationStepEntity } from '@novu/dal';
import type { ExecuteOutput } from '@novu/framework/internal';
import type { TriggerOverrides, WorkflowPreferences } from '@novu/shared';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class SendMessageCommand extends EnvironmentWithUserCommand {
  @IsDefined()
  @IsString()
  identifier: string;

  @IsDefined()
  payload: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  @IsOptional()
  compileContext?: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  @IsDefined()
  overrides: TriggerOverrides;

  @IsDefined()
  step: NotificationStepEntity;

  @IsString()
  @IsDefined()
  transactionId: string;

  @IsDefined()
  notificationId: string;

  @IsOptional()
  _templateId?: string;

  @IsDefined()
  subscriberId: string;

  @IsDefined()
  _subscriberId: string;

  @IsDefined()
  jobId: string;

  @IsOptional()
  events?: any[];

  @IsDefined()
  job: JobEntity;

  @IsOptional()
  bridgeData?: ExecuteOutput | null;

  @IsDefined()
  tags: string[];

  @IsOptional()
  statelessPreferences?: WorkflowPreferences;
}
