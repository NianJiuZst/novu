import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AIPreferenceDto {
  @IsOptional()
  @IsBoolean()
  readonly enabled?: boolean;

  @IsOptional()
  @IsString()
  readonly prompt?: string;
}

export class UpdatePreferencesRequestDto {
  @IsOptional()
  @IsBoolean()
  readonly email?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly sms?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly in_app?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly chat?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly push?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AIPreferenceDto)
  readonly aiPreference?: AIPreferenceDto;
}
