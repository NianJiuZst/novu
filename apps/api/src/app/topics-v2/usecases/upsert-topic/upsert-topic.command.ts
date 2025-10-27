import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class UpsertTopicCommand extends EnvironmentCommand {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  key: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  name?: string;

  @IsBoolean()
  @IsOptional()
  failIfExists?: boolean;
}
