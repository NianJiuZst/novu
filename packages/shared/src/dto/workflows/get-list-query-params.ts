import { LimitOffsetPaginationDto } from '../../types';
import type { WorkflowResponseDto } from './workflow.dto';

export class GetListQueryParams extends LimitOffsetPaginationDto<
  WorkflowResponseDto,
  'updatedAt' | 'name' | 'lastTriggeredAt'
> {
  query?: string;
}
