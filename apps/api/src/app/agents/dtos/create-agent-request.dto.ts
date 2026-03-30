import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class CreateAgentRequestDto {
  @ApiProperty()
  @IsString()
  @IsDefined()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  identifier?: string;
}
