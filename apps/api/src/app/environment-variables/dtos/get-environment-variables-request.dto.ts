import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetEnvironmentVariablesRequestDto {
  @ApiPropertyOptional({ description: 'Filter variables by key (case-insensitive partial match)' })
  @IsString()
  @IsOptional()
  search?: string;
}
