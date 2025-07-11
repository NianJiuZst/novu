import { Injectable } from '@nestjs/common';

import type { WorkflowOverrideRepository } from '@novu/dal';
import type { GetWorkflowOverridesResponseDto } from '../../dtos/get-workflow-overrides-response.dto';
import type { GetWorkflowOverridesCommand } from './get-workflow-overrides.command';

@Injectable()
export class GetWorkflowOverrides {
  constructor(private workflowOverrideRepository: WorkflowOverrideRepository) {}

  async execute(command: GetWorkflowOverridesCommand): Promise<GetWorkflowOverridesResponseDto> {
    const { data } = await this.workflowOverrideRepository.getList(
      {
        skip: command.page * command.limit,
        limit: command.limit,
      },
      {
        environmentId: command.environmentId,
      }
    );

    return {
      data,
      page: command.page,
      pageSize: command.limit,
      hasMore: data?.length === command.limit,
    };
  }
}
