import { DomainRouteTypeEnum } from '@novu/shared';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';

export class UpdateRouteCommand extends EnvironmentWithUserCommand {
  @IsString()
  @IsNotEmpty()
  domainId: string;

  @IsInt()
  @Min(0)
  routeIndex: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  destination?: string;

  @IsEnum(DomainRouteTypeEnum)
  @IsOptional()
  type?: DomainRouteTypeEnum;
}
