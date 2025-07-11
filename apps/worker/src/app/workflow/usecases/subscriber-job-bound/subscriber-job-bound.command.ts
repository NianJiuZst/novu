import { EnvironmentWithUserCommand } from '@novu/application-generic';
import type { SubscriberEntity, TopicEntity } from '@novu/dal';
import type { DiscoverWorkflowOutput } from '@novu/framework/internal';
import {
  type ISubscribersDefine,
  type ITenantDefine,
  type StatelessControls,
  SubscriberSourceEnum,
  type TriggerOverrides,
  TriggerRequestCategoryEnum,
} from '@novu/shared';
import { IsDefined, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SubscriberJobBoundCommand extends EnvironmentWithUserCommand {
  @IsString()
  @IsDefined()
  transactionId: string;

  @IsDefined()
  payload: any;

  @IsDefined()
  @IsString()
  identifier: string;

  @IsDefined()
  overrides: TriggerOverrides;

  @IsOptional()
  @ValidateNested()
  tenant?: ITenantDefine;

  @IsOptional()
  actor?: SubscriberEntity;

  @IsDefined()
  @IsMongoId()
  templateId: string;

  @IsDefined()
  subscriber: ISubscribersDefine;

  @IsOptional()
  topics?: Pick<TopicEntity, '_id' | 'key'>[];

  @IsDefined()
  @IsEnum(SubscriberSourceEnum)
  _subscriberSource: SubscriberSourceEnum;

  @IsOptional()
  @IsEnum(TriggerRequestCategoryEnum)
  requestCategory?: TriggerRequestCategoryEnum;

  bridge?: { url: string; workflow: DiscoverWorkflowOutput };

  controls?: StatelessControls;

  @IsDefined()
  @IsString()
  environmentName: string;
}
