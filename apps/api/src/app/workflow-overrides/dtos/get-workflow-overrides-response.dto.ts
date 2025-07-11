import { ApiProperty } from '@nestjs/swagger';
import type { IWorkflowOverridesResponseDto } from '@novu/shared';
import type { OverrideResponseDto } from './shared';

export class GetWorkflowOverridesResponseDto implements IWorkflowOverridesResponseDto {
  @ApiProperty()
  hasMore: boolean;

  @ApiProperty()
  data: OverrideResponseDto[];

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  page: number;
}
