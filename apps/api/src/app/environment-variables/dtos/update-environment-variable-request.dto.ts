import { ApiPropertyOptional } from '@nestjs/swagger';
import { IUpdateEnvironmentVariableDto } from '@novu/shared';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { EnvironmentVariableValueDto } from './create-environment-variable-request.dto';

export class UpdateEnvironmentVariableRequestDto implements IUpdateEnvironmentVariableDto {
  @ApiPropertyOptional({ description: 'Unique key for the variable. Must be uppercase with underscores only.' })
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: 'Key must be uppercase and contain only letters, digits, and underscores' })
  @IsOptional()
  key?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isSecret?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultValue?: string;

  @ApiPropertyOptional({ type: [EnvironmentVariableValueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnvironmentVariableValueDto)
  @IsOptional()
  values?: EnvironmentVariableValueDto[];
}
