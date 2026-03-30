import { IsDefined, IsObject, IsOptional, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class CreateConversationCommand extends EnvironmentCommand {
  @IsDefined()
  @IsString()
  subscriberId: string;

  @IsDefined()
  @IsString()
  agentId: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  platformThreadId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
