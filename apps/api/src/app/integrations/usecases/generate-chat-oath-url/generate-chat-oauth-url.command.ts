import { IsValidContextPayload } from '@novu/application-generic';
import { ChannelEndpointType, ContextPayload } from '@novu/shared';
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class GenerateChatOauthUrlCommand extends EnvironmentCommand {
  @IsNotEmpty()
  @IsString()
  readonly integrationIdentifier: string;

  @IsOptional()
  @IsString()
  readonly connectionIdentifier?: string;

  @IsOptional()
  @IsString()
  readonly subscriberId?: string;

  @IsOptional()
  @IsValidContextPayload({ maxCount: 5 })
  readonly context?: ContextPayload;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly scope?: string[];

  @IsOptional()
  @IsString()
  readonly endpointType?: ChannelEndpointType;

  @IsOptional()
  @IsObject()
  readonly endpointData?: Record<string, string>;
}
