import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { StepTypeEnum } from '@novu/shared';
import { Transform } from 'class-transformer';
import { EnvironmentCommand } from '../../commands';

export class TierRestrictionsValidateCommand extends EnvironmentCommand {
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : value))
  @IsNumber()
  amount?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  deferDurationMs?: number;

  @IsOptional()
  @IsString()
  cron?: string;

  @IsEnum(StepTypeEnum)
  @IsOptional()
  stepType?: StepTypeEnum;
}
