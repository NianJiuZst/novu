import { ApiProperty } from '@nestjs/swagger';
import { StepIssueEnum } from '@novu/shared';
import { IsEnum } from 'class-validator';
import { BaseIssueDto } from './base-issue.dto';

export class StepIssueDto extends BaseIssueDto<StepIssueEnum> {
  @ApiProperty({
    description: 'Type of step issue',
    enum: [...Object.values(StepIssueEnum)],
    enumName: 'StepIssueEnum',
  })
  @IsEnum(StepIssueEnum)
  issueType: StepIssueEnum;
}
