import { ConflictException, Injectable } from '@nestjs/common';
import { encryptSecret, ResourceValidatorService } from '@novu/application-generic';
import { EnvironmentVariableRepository } from '@novu/dal';
import { EnvironmentVariableResponseDto } from '../../dtos/environment-variable-response.dto';
import { toEnvironmentVariableResponseDto } from '../get-environment-variables/get-environment-variables.usecase';
import { CreateEnvironmentVariableCommand } from './create-environment-variable.command';

@Injectable()
export class CreateEnvironmentVariable {
  constructor(
    private environmentVariableRepository: EnvironmentVariableRepository,
    private resourceValidatorService: ResourceValidatorService
  ) {}

  async execute(command: CreateEnvironmentVariableCommand): Promise<EnvironmentVariableResponseDto> {
    await this.resourceValidatorService.validateEnvironmentVariablesLimit(command.organizationId);

    const existing = await this.environmentVariableRepository.findByKey(command.organizationId, command.key);

    if (existing) {
      throw new ConflictException(`Environment variable with key "${command.key}" already exists`);
    }

    const values = (command.values ?? []).map((v) => ({
      _environmentId: v._environmentId,
      value: encryptSecret(v.value),
    }));

    const created = await this.environmentVariableRepository.create({
      _organizationId: command.organizationId,
      key: command.key,
      isSecret: command.isSecret ?? false,
      values,
    });

    return toEnvironmentVariableResponseDto(created);
  }
}
