import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class PatchWorkflowDto {
  @ApiProperty({
    description: 'Indicates whether the workflow is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({
    description: 'Name of the workflow',
    example: 'Marketing Automation Workflow',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Detailed description of the workflow',
    example: 'Workflow for automating marketing campaign processes',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Tags associated with the workflow',
    example: ['marketing', 'automation', 'campaign'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
