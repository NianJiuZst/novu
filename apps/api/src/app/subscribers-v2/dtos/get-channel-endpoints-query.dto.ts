import { ApiProperty } from '@nestjs/swagger';
import {
  ChannelTypeEnum,
  ChatProviderIdEnum,
  EmailProviderIdEnum,
  InAppProviderIdEnum,
  ProvidersIdEnum,
  PushProviderIdEnum,
  SmsProviderIdEnum,
} from '@novu/shared';
import { IsEnum, IsOptional, IsString } from 'class-validator';

// Create array of all provider values for validation and documentation
const ALL_PROVIDERS = [
  ...Object.values(EmailProviderIdEnum),
  ...Object.values(SmsProviderIdEnum),
  ...Object.values(ChatProviderIdEnum),
  ...Object.values(PushProviderIdEnum),
  ...Object.values(InAppProviderIdEnum),
];

export class GetChannelEndpointsQueryDto {
  @ApiProperty({
    description: 'Channel type to filter results.',
    enum: ChannelTypeEnum,
    required: false,
  })
  @IsEnum(ChannelTypeEnum)
  @IsOptional()
  channel?: ChannelTypeEnum;

  @ApiProperty({
    description: 'Provider identifier to filter results.',
    enum: ALL_PROVIDERS,
    required: false,
  })
  @IsEnum(ALL_PROVIDERS)
  @IsOptional()
  provider?: ProvidersIdEnum;

  @ApiProperty({
    description: 'Endpoint address to filter results (e.g., email address, phone number).',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  endpoint?: string;
}
