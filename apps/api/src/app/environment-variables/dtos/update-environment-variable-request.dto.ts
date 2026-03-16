import { ApiPropertyOptional } from '@nestjs/swagger';
import { IUpdateEnvironmentVariableDto } from '@novu/shared';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { EnvironmentVariableValueDto } from './create-environment-variable-request.dto';

export class UpdateEnvironmentVariableRequestDto implements IUpdateEnvironmentVariableDto {
  @ApiPropertyOptional({
    description:
      'Unique key for the variable. Must start with a letter and contain only letters, digits, and underscores.',
  })
  @IsString()
  @Matches(/^[A-Za-z][A-Za-z0-9_]*$/, {
    message: 'Key must start with a letter and contain only letters, digits, and underscores',
  })
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
