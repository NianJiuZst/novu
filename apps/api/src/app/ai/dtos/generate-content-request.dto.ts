import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StepTypeEnum } from '@novu/shared';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { MessageDto } from './message.dto';
import { WorkflowContextDto } from './workflow-context.dto';

export class GenerateContentRequestDto {
  @ApiProperty({
    description: 'Type of the step/channel',
    enum: StepTypeEnum,
  })
  @IsEnum(StepTypeEnum)
  stepType: StepTypeEnum;

  @ApiProperty({
    description: 'Array of conversation messages',
    type: [MessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @ApiPropertyOptional({
    description: 'Workflow context for better AI suggestions',
    type: WorkflowContextDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WorkflowContextDto)
  context?: WorkflowContextDto;

  @ApiPropertyOptional({
    description: 'Editor type for email content: "html" for HTML editor, "block" or undefined for block editor',
  })
  @IsOptional()
  @IsString()
  editorType?: string;
}
