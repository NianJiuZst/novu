import { DomainRouteTypeEnum } from '@novu/shared';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';

export class CreateRouteCommand extends EnvironmentWithUserCommand {
  @IsString()
  @IsNotEmpty()
  domainId: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsEnum(DomainRouteTypeEnum)
  type: DomainRouteTypeEnum;
}
