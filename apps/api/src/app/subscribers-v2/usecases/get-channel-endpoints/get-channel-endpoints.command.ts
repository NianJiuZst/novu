import {
  ChannelTypeEnum,
  ChatProviderIdEnum,
  EmailProviderIdEnum,
  InAppProviderIdEnum,
  ProvidersIdEnum,
  PushProviderIdEnum,
  SmsProviderIdEnum,
} from '@novu/shared';
import { IsDefined, IsEnum, IsOptional, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

const ALL_PROVIDERS = [
  ...Object.values(EmailProviderIdEnum),
  ...Object.values(SmsProviderIdEnum),
  ...Object.values(ChatProviderIdEnum),
  ...Object.values(PushProviderIdEnum),
  ...Object.values(InAppProviderIdEnum),
];

export class GetChannelEndpointsCommand extends EnvironmentCommand {
  @IsString()
  @IsDefined()
  subscriberId: string;

  @IsEnum(ChannelTypeEnum)
  @IsOptional()
  channel?: ChannelTypeEnum;

  @IsEnum(ALL_PROVIDERS)
  @IsOptional()
  provider?: ProvidersIdEnum;

  @IsString()
  @IsOptional()
  endpoint?: string;
}
