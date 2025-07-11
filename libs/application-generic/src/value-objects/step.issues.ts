import type { StepCreateAndUpdateKeys } from '@novu/shared';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { ContentIssue } from './content.issue';
import { StepIssue } from './step.issue';

export class StepIssues {
  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => StepIssue)
  body?: Record<StepCreateAndUpdateKeys, StepIssue>;

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ContentIssue)
  controls?: Record<string, ContentIssue[]>;
}
