import { ApiProperty } from '@nestjs/swagger';
import { DomainRouteTypeEnum } from '@novu/shared';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class DomainRouteDto {
  @ApiProperty({ description: 'Email address prefix (e.g. "support", "*")' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Destination agent ID or webhook URL' })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({ enum: DomainRouteTypeEnum })
  @IsEnum(DomainRouteTypeEnum)
  type: DomainRouteTypeEnum;
}
