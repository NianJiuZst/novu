import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class WorkflowContextDto {
  @ApiPropertyOptional({
    description: 'Name of the workflow',
  })
  @IsOptional()
  @IsString()
  workflowName?: string;

  @ApiPropertyOptional({
    description: 'Description of the workflow',
  })
  @IsOptional()
  @IsString()
  workflowDescription?: string;

  @ApiPropertyOptional({
    description: 'Available variables in the step',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];
}
