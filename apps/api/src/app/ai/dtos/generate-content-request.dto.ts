import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StepTypeEnum } from '@novu/shared';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class MessageDto {
  @ApiProperty({
    description: 'Role of the message sender',
    enum: MessageRole,
  })
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiProperty({
    description: 'Content of the message',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

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
}
