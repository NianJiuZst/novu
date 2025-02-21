import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EnvironmentEntity, EnvironmentRepository, NotificationTemplateRepository } from '@novu/dal';
import { AddExternalAuthISsuerUrlsCommand } from './add-external-auth-issuer-urls.command';
import { GetEnvironmentTagsDto } from '../../dtos/get-environment-tags.dto';

const EXTERNAL_AUTH_ISSUER_URLS_MAX_SIZE = 5;

@Injectable()
export class AddExternalAuthISsuerUrls {
  constructor(private environmentRepository: EnvironmentRepository) {}

  async execute(command: AddExternalAuthISsuerUrlsCommand) {
    const environment: Omit<EnvironmentEntity, 'apiKeys'> | null = await this.environmentRepository.findOne(
      {
        _id: command.environmentId,
        _organizationId: command.organizationId,
      },
      '-apiKeys'
    );

    if (!environment) throw new NotFoundException(`Environment ${command.environmentId} not found`);

    if (environment.externalAuthIssuerUrls?.length === EXTERNAL_AUTH_ISSUER_URLS_MAX_SIZE) {
      throw new ConflictException(`Max ${EXTERNAL_AUTH_ISSUER_URLS_MAX_SIZE} URLS allowed`);
    }

    await this.addExternalAuthIssuerUrls(command);
  }

  private async addExternalAuthIssuerUrls(command: AddExternalAuthISsuerUrlsCommand): Promise<void> {
    await this.environmentRepository.updateOne(
      {
        _id: command.environmentId,
        _organizationId: command.organizationId,
      },
      {
        $addToSet: {
          externalAuthIssuerUrls: {
            $each: command.externalAuthIssuerUrls.map((url) => ({ url, _userId: command.userId })),
          },
        },
      }
    );
  }
}
