import { ApiProperty } from '@nestjs/swagger';
import { StepContentIssueEnum } from '@novu/shared';
import { IsEnum } from 'class-validator';
import { BaseIssueDto } from './base-issue.dto';

export class StepContentIssueDto extends BaseIssueDto<StepContentIssueEnum> {
  @ApiProperty({
    description: 'Type of step content issue',
    enum: [...Object.values(StepContentIssueEnum)],
    enumName: 'StepContentIssueEnum',
  })
  @IsEnum(StepContentIssueEnum)
  issueType: StepContentIssueEnum;
}
