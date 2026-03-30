import { ConversationStatusEnum } from '@novu/shared';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class UpdateConversationCommand extends EnvironmentCommand {
  @IsString()
  identifier: string;

  @IsOptional()
  @IsEnum(ConversationStatusEnum)
  status?: ConversationStatusEnum;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  expectedSubscriberId?: string;
}
