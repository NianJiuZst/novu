import { Injectable, NotFoundException } from '@nestjs/common';
import { encryptSecret } from '@novu/application-generic';
import { EnvironmentVariableRepository } from '@novu/dal';
import { EnvironmentVariableResponseDto } from '../../dtos/environment-variable-response.dto';
import { toEnvironmentVariableResponseDto } from '../get-environment-variables/get-environment-variables.usecase';
import { UpdateEnvironmentVariableCommand } from './update-environment-variable.command';

@Injectable()
export class UpdateEnvironmentVariable {
  constructor(private environmentVariableRepository: EnvironmentVariableRepository) {}

  async execute(command: UpdateEnvironmentVariableCommand): Promise<EnvironmentVariableResponseDto> {
    const existing = await this.environmentVariableRepository.findById(
      { _id: command.variableId, _organizationId: command.organizationId },
      '*'
    );

    if (!existing) {
      throw new NotFoundException(`Environment variable with id ${command.variableId} not found`);
    }

    const isSecret = command.isSecret !== undefined ? command.isSecret : existing.isSecret;

    const updateBody: Record<string, unknown> = {};

    if (command.key !== undefined) updateBody.key = command.key;
    if (command.isSecret !== undefined) updateBody.isSecret = command.isSecret;

    if (command.values !== undefined) {
      updateBody.values = command.values.map((v) => ({
        _environmentId: v._environmentId,
        value: isSecret ? encryptSecret(v.value) : v.value,
      }));
    } else if (command.isSecret !== undefined && command.isSecret !== existing.isSecret) {
      updateBody.values = existing.values.map((v) => ({
        _environmentId: v._environmentId,
        value: command.isSecret ? encryptSecret(v.value as string) : (v.value as string),
      }));
    }

    await this.environmentVariableRepository.update(
      { _id: command.variableId as any, _organizationId: command.organizationId },
      { $set: updateBody }
    );

    const updated = await this.environmentVariableRepository.findById(
      { _id: command.variableId, _organizationId: command.organizationId },
      '*'
    );

    if (!updated) {
      throw new NotFoundException(`Environment variable with id ${command.variableId} not found`);
    }

    return toEnvironmentVariableResponseDto(updated);
  }
}
