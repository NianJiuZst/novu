import { Injectable, NotFoundException } from '@nestjs/common';
import { EnvironmentVariableRepository } from '@novu/dal';
import { DeleteEnvironmentVariableCommand } from './delete-environment-variable.command';

@Injectable()
export class DeleteEnvironmentVariable {
  constructor(private environmentVariableRepository: EnvironmentVariableRepository) {}

  async execute(command: DeleteEnvironmentVariableCommand): Promise<void> {
    const existing = await this.environmentVariableRepository.findById(
      { _id: command.variableId, _organizationId: command.organizationId },
      '*'
    );

    if (!existing) {
      throw new NotFoundException(`Environment variable with id ${command.variableId} not found`);
    }

    await this.environmentVariableRepository.delete({
      _id: command.variableId as any,
      _organizationId: command.organizationId,
    });
  }
}
