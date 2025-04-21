import { EnvironmentEntity } from '@novu/dal';
import { IsDefined, IsOptional, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../commands';

export class GetSubscriberCommand extends EnvironmentCommand {
  @IsString()
  @IsDefined()
  subscriberId: string;

  @IsOptional()
  environment?: EnvironmentEntity;

  @IsOptional()
  skipSubscriberResolve?: boolean;
}
