import { IsArray, IsDefined, IsEnum, IsNotEmpty, IsString, IsMongoId } from 'class-validator';
import { MessagesStatusEnum } from '@novu/shared';
import { EnvironmentWithSubscriber } from '../../../shared/commands/project.command';

export class MarkMessageAsByMarkCommand extends EnvironmentWithSubscriber {
  @IsArray()
  @IsMongoId({ each: true })
  messageIds: string[];

  @IsDefined()
  @IsEnum(MessagesStatusEnum)
  markAs: MessagesStatusEnum;

  @IsNotEmpty()
  @IsString()
  __source: 'notification_center' | 'api';
}
