import { StepIssueEnum } from '@novu/shared';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class StepIssue {
  @IsEnum(StepIssueEnum)
  issueType: StepIssueEnum; // Union of both

  @IsOptional()
  @IsString()
  variableName?: string;

  @IsString()
  message: string;
}
