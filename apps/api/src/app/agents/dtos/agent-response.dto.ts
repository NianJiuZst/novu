import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentResponseDto {
  @ApiPropertyOptional()
  _id?: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  identifier: string;

  @ApiProperty()
  _environmentId: string;

  @ApiProperty()
  _organizationId: string;

  @ApiPropertyOptional({ type: [String] })
  integrationIds?: string[];

  @ApiPropertyOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  updatedAt?: string;
}
