import { IsValidContextPayload } from '@novu/application-generic';
import { IntegrationEntity } from '@novu/dal';
import { ChannelEndpointType, ContextPayload } from '@novu/shared';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../../shared/commands/project.command';

export class GenerateSlackOauthUrlCommand extends EnvironmentCommand {
  @IsOptional()
  @IsString()
  readonly connectionIdentifier?: string;

  @IsOptional()
  @IsString()
  readonly subscriberId?: string;

  readonly integration: IntegrationEntity;

  @IsOptional()
  @IsValidContextPayload({ maxCount: 5 })
  context?: ContextPayload;

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
