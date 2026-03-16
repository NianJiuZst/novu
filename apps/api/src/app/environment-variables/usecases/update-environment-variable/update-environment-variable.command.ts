import { OrganizationLevelWithUserCommand } from '@novu/application-generic';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { EnvironmentVariableValueCommand } from '../create-environment-variable/create-environment-variable.command';

export class UpdateEnvironmentVariableCommand extends OrganizationLevelWithUserCommand {
  @IsString()
  @IsNotEmpty()
  variableId: string;

  @IsString()
  @Matches(/^[A-Za-z][A-Za-z0-9_]*$/)
  @IsOptional()
  key?: string;

  @IsBoolean()
  @IsOptional()
  isSecret?: boolean;

  @IsString()
  @IsOptional()
  defaultValue?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnvironmentVariableValueCommand)
  @IsOptional()
  values?: EnvironmentVariableValueCommand[];
}
