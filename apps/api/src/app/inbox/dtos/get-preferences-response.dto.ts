import { IPreferenceChannels, PreferenceLevelEnum } from '@novu/shared';
import { IsDefined, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { Workflow } from '../utils/types';

export class AIPreferenceResponseDto {
  @IsDefined()
  enabled: boolean;

  @IsOptional()
  prompt?: string;
}

export class GetPreferencesResponseDto {
  @IsDefined()
  @IsEnum({
    enum: PreferenceLevelEnum,
  })
  level: PreferenceLevelEnum;

  @IsOptional()
  workflow?: Workflow;

  @IsDefined()
  enabled: boolean;

  @IsDefined()
  channels: IPreferenceChannels;

  @IsOptional()
  @ValidateNested()
  @Type(() => AIPreferenceResponseDto)
  aiPreference?: AIPreferenceResponseDto;
}
