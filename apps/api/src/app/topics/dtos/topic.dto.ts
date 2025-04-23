import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class TopicDto {
  @ApiProperty({
    description: 'Unique identifier for the topic',
    example: '613b1f8e4f1a2c001c8e4b1a',
  })
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'Identifier for the organization that owns the topic',
    example: 'org-12345',
  })
  @IsString()
  _organizationId: string;

  @ApiProperty({
    description: 'Identifier for the environment associated with the topic',
    example: 'env-67890',
  })
  @IsString()
  _environmentId: string;

  @ApiProperty({
    description: 'Key for the topic, used for identifying it uniquely',
    example: 'topic-key-01',
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: 'Name of the topic',
    example: 'My First Topic',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'List of subscriber IDs for the topic',
    example: ['sub-001', 'sub-002'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subscribers?: string[];
}
