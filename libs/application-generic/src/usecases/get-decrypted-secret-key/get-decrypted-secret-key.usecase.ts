import { Injectable, NotFoundException } from '@nestjs/common';
import { EnvironmentRepository } from '@novu/dal';
import { decryptApiKey } from '../../encryption';
import { GetDecryptedSecretKeyCommand } from './get-decrypted-secret-key.command';

@Injectable()
export class GetDecryptedSecretKey {
  constructor(private readonly environmentRepository: EnvironmentRepository) {}

  async execute(command: GetDecryptedSecretKeyCommand): Promise<string> {
    const environment = await this.environmentRepository.findOne(
      {
        _id: command.environmentId,
      },
      '_id apiKeys',
      { readPreference: 'secondaryPreferred' }
    );

    if (!environment) {
      throw new NotFoundException(`Environment ${command.environmentId} not found`);
    }

    const apiKey = environment.apiKeys?.[0]?.key;
    if (!apiKey) {
      throw new NotFoundException(`Environment ${command.environmentId} has no API keys configured`);
    }

    return decryptApiKey(apiKey);
  }
}
