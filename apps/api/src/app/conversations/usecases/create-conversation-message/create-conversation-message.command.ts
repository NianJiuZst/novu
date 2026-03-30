import { ConversationMessageRoleEnum } from '@novu/shared';
import { IsDefined, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class CreateConversationMessageCommand extends EnvironmentCommand {
  @IsDefined()
  @IsString()
  conversationIdentifier: string;

  @IsDefined()
  @IsEnum(ConversationMessageRoleEnum)
  role: ConversationMessageRoleEnum;

  @IsDefined()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsString()
  senderAvatar?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  platformMessageId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  expectedSubscriberId?: string;
}
