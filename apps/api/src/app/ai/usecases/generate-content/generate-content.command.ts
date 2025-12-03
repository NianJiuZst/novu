import { BaseCommand } from '@novu/application-generic';
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { StepTypeEnum } from '@novu/shared';

export class GenerateContentCommand extends BaseCommand {
  @IsEnum(StepTypeEnum)
  @IsNotEmpty()
  readonly stepType: StepTypeEnum;

  @IsArray()
  @IsNotEmpty()
  readonly messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;

  @IsOptional()
  @IsObject()
  readonly context?: {
    workflowName?: string;
    workflowDescription?: string;
    variables?: string[];
  };

  @IsString()
  @IsNotEmpty()
  readonly organizationId: string;

  @IsString()
  @IsNotEmpty()
  readonly environmentId: string;

  @IsString()
  @IsNotEmpty()
  readonly userId: string;
}



