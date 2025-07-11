import { Injectable, NotFoundException } from '@nestjs/common';

import type { WorkflowOverrideRepository } from '@novu/dal';

import type { GetWorkflowOverrideResponseDto } from '../../dtos';
import type { GetWorkflowOverrideByIdCommand } from './get-workflow-override-by-id.command';

@Injectable()
export class GetWorkflowOverrideById {
  constructor(private workflowOverrideRepository: WorkflowOverrideRepository) {}

  async execute(command: GetWorkflowOverrideByIdCommand): Promise<GetWorkflowOverrideResponseDto> {
    const workflowOverride = await this.workflowOverrideRepository.findOne({
      _environmentId: command.environmentId,
      _id: command.overrideId,
    });

    if (!workflowOverride) {
      throw new NotFoundException(`Workflow Override with id ${command.overrideId} not found`);
    }

    return workflowOverride;
  }
}
