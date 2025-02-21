import jwt from 'jsonwebtoken';
import { EnvironmentRepository } from '@novu/dal';
import { Injectable } from '@nestjs/common';
import { GenerateJwtCommand } from './generateJwtCommand';

@Injectable()
export class GenerateJwtUsecase {
  constructor(private environmentRepository: EnvironmentRepository) {}
  async execute(command: GenerateJwtCommand): Promise<string> {
    const { environmentId } = command.user;
    const env = await this.environmentRepository.findByIdAndOrganization(environmentId, command.user.organizationId);
    const identifier = env?.identifier;
    const apiKey = env?.apiKeys[0].key;
    if (!apiKey) {
      throw new Error('No API key found for environment');
    }

    return this.createJWT({ publishableKey: identifier, subscriberId: command.subscriberId }, apiKey);
  }
  private createJWT(payload: object, secretKey: string, expiresIn: string = '24h'): string {
    return jwt.sign(payload, secretKey, {
      expiresIn,
    });
  }
}
