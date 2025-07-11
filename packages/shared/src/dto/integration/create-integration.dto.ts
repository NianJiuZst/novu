import type { ChannelTypeEnum } from '../../types';
import type { IConstructIntegrationDto } from './construct-integration.interface';

export interface ICreateIntegrationBodyDto extends IConstructIntegrationDto {
  providerId: string;
  channel: ChannelTypeEnum;
}
