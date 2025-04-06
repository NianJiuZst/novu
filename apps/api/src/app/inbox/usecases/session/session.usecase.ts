import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';

import {
  AnalyticsService,
  CreateOrUpdateSubscriberCommand,
  CreateOrUpdateSubscriberUseCase,
  encryptApiKey,
  IAuthService,
  LogDecorator,
  PinoLogger,
  SelectIntegration,
  SelectIntegrationCommand,
  shortId,
} from '@novu/application-generic';
import {
  CommunityOrganizationRepository,
  CommunityUserRepository,
  EnvironmentEntity,
  EnvironmentRepository,
  IntegrationRepository,
} from '@novu/dal';
import { ChannelTypeEnum, InAppProviderIdEnum } from '@novu/shared';
import { differenceInDays } from 'date-fns';
import { ApiException } from '../../../shared/exceptions/api.exception';
import { SubscriberSessionResponseDto } from '../../dtos/subscriber-session-response.dto';
import { AnalyticsEventsEnum } from '../../utils';
import { validateHmacEncryption } from '../../utils/encryption';
import { NotificationsCountCommand } from '../notifications-count/notifications-count.command';
import { NotificationsCount } from '../notifications-count/notifications-count.usecase';
import { SessionCommand } from './session.command';
import { GenerateUniqueApiKey } from '../../../environments-v1/usecases/generate-unique-api-key/generate-unique-api-key.usecase';
import { CreateNovuIntegrations } from '../../../integrations/usecases/create-novu-integrations/create-novu-integrations.usecase';
import { CreateNovuIntegrationsCommand } from '../../../integrations/usecases/create-novu-integrations/create-novu-integrations.command';
import { EnvironmentResponseDto } from '../../../environments-v1/dtos/environment-response.dto';

const ALLOWED_ORIGINS_REGEX = new RegExp(process.env.FRONT_BASE_URL || '');

@Injectable()
export class Session {
  private readonly SANDBOX_ENVIRONMENT_PREFIX = 'pk_sandbox_';

  constructor(
    private environmentRepository: EnvironmentRepository,
    private communityOrganizationRepository: CommunityOrganizationRepository,
    private createSubscriber: CreateOrUpdateSubscriberUseCase,
    @Inject('AUTH_SERVICE') private authService: IAuthService,
    private selectIntegration: SelectIntegration,
    private analyticsService: AnalyticsService,
    private notificationsCount: NotificationsCount,
    private integrationRepository: IntegrationRepository,
    private generateUniqueApiKey: GenerateUniqueApiKey,
    private createNovuIntegrationsUsecase: CreateNovuIntegrations,
    private communityUserRepository: CommunityUserRepository,
    private logger: PinoLogger
  ) {}

  @LogDecorator()
  async execute(command: SessionCommand): Promise<SubscriberSessionResponseDto> {
    const isSandboxInitialize = !command.applicationIdentifier;
    const isSandbox = command.applicationIdentifier?.includes(this.SANDBOX_ENVIRONMENT_PREFIX);
    const isSandboxExpired = isSandbox ? await this.isSandboxExpired(command.applicationIdentifier) : false;

    const applicationIdentifier =
      isSandboxInitialize || isSandboxExpired
        ? (await this.processSandbox()).identifier
        : command.applicationIdentifier;

    const environment = await this.environmentRepository.findEnvironmentByIdentifier(applicationIdentifier);

    if (!environment) {
      throw new ApiException('Please provide a valid application identifier');
    }

    const inAppIntegration = await this.selectIntegration.execute(
      SelectIntegrationCommand.create({
        environmentId: environment._id,
        organizationId: environment._organizationId,
        channelType: ChannelTypeEnum.IN_APP,
        providerId: InAppProviderIdEnum.Novu,
        filterData: {},
      })
    );

    if (!inAppIntegration) {
      throw new NotFoundException('The active in-app integration could not be found');
    }

    if (inAppIntegration.credentials.hmac) {
      validateHmacEncryption({
        apiKey: environment.apiKeys[0].key,
        subscriberId: command.subscriberId,
        subscriberHash: command.subscriberHash,
      });
    }

    const subscriber = await this.createSubscriber.execute(
      CreateOrUpdateSubscriberCommand.create({
        environmentId: environment._id,
        organizationId: environment._organizationId,
        subscriberId: command.subscriberId,
      })
    );

    this.analyticsService.mixpanelTrack(AnalyticsEventsEnum.SESSION_INITIALIZED, '', {
      _organization: environment._organizationId,
      environmentName: environment.name,
      _subscriber: subscriber._id,
      origin: command.applicationIdentifier ? command.origin : 'sandbox',
    });

    const { data } = await this.notificationsCount.execute(
      NotificationsCountCommand.create({
        organizationId: environment._organizationId,
        environmentId: environment._id,
        subscriberId: command.subscriberId,
        filters: [{ read: false }],
      })
    );
    const [{ count: totalUnreadCount }] = data;

    const token = await this.authService.getSubscriberWidgetToken(subscriber);

    const removeNovuBranding = inAppIntegration.removeNovuBranding || false;

    /**
     * We want to prevent the playground inbox demo from marking the integration as connected
     * And only treat the real customer domain or local environment as valid origins
     */
    const isOriginFromNovu = ALLOWED_ORIGINS_REGEX.test(command.origin ?? '');
    if (!isOriginFromNovu && !inAppIntegration.connected) {
      this.analyticsService.mixpanelTrack(AnalyticsEventsEnum.INBOX_CONNECTED, '', {
        _organization: environment._organizationId,
        environmentName: environment.name,
      });

      await this.integrationRepository.updateOne(
        {
          _id: inAppIntegration._id,
          _organizationId: environment._organizationId,
          _environmentId: environment._id,
        },
        {
          $set: {
            connected: true,
          },
        }
      );
    }

    return {
      ...(isSandboxInitialize ? { applicationIdentifier: environment.identifier } : {}),
      token,
      totalUnreadCount,
      removeNovuBranding,
      isDevelopmentMode: environment.name.toLowerCase() !== 'production',
    };
  }

  async isSandboxExpired(applicationIdentifier: string | undefined) {
    if (!applicationIdentifier) {
      return true; // If no identifier is provided, consider it expired
    }

    const parts = applicationIdentifier.replace(this.SANDBOX_ENVIRONMENT_PREFIX, '').split('_');
    if (parts.length < 1) {
      return true; // Invalid format, consider expired
    }

    const createdDate = parts[0];

    if (!createdDate || createdDate.length < 8) {
      // Ensure we have at least 4 bytes (8 hex chars)
      return true; // Invalid timestamp format, consider expired
    }

    try {
      const createdDateTimestamp = timestampHexToDate(createdDate);
      const now = new Date();
      const diffTime = differenceInDays(now, createdDateTimestamp);

      if (diffTime > 0) {
        return true;
      }
    } catch (error) {
      // If there's any error parsing the timestamp, consider it expired
      return true;
    }

    return false;
  }

  async processSandbox(): Promise<EnvironmentResponseDto> {
    const organization = await this.communityOrganizationRepository.findOne({
      name: 'Sandbox Organization baking-endanger-luckless',
    });

    if (!organization) {
      this.logger.error('Sandbox Organization not found');
      throw new InternalServerErrorException('Sandbox Organization not found');
    }

    const user = await this.communityUserRepository.findByEmail('system-sandbox@novu.co');

    if (!user) {
      throw new InternalServerErrorException('Sandbox User not found');
    }

    const key = `sk_${await this.generateUniqueApiKey.execute()}`;
    const encryptedApiKey = encryptApiKey(key);
    const hashedApiKey = createHash('sha256').update(key).digest('hex');

    const encodedDate = dateToTimestampHex(new Date());
    const identifier = `${this.SANDBOX_ENVIRONMENT_PREFIX}${encodedDate}_${shortId(4)}`;
    const environment = await this.environmentRepository.create({
      _organizationId: organization._id,
      name: `Sandbox ${new Date().toLocaleDateString()}`,
      identifier,
      apiKeys: [
        {
          key: encryptedApiKey,
          _userId: user._id,
          hash: hashedApiKey,
        },
      ],
    });

    await this.createNovuIntegrationsUsecase.execute(
      CreateNovuIntegrationsCommand.create({
        environmentId: environment._id,
        organizationId: environment._organizationId,
        userId: user._id,
      })
    );

    // do we need to create a default layout/notification group for backward compatibility?

    return this.convertEnvironmentEntityToDto(environment);
  }

  private convertEnvironmentEntityToDto(environment: EnvironmentEntity) {
    const dto = new EnvironmentResponseDto();

    dto._id = environment._id;
    dto.name = environment.name;
    dto._organizationId = environment._organizationId;
    dto.identifier = environment.identifier;
    dto._parentId = environment._parentId;

    if (environment.apiKeys && environment.apiKeys.length > 0) {
      dto.apiKeys = environment.apiKeys.map((apiKey) => ({
        key: apiKey.key,
        hash: apiKey.hash,
        _userId: apiKey._userId,
      }));
    }

    return dto;
  }
}

function dateToTimestampHex(date) {
  const timeInSeconds = Math.floor(date.getTime() / 1000);
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(timeInSeconds, 0);

  return buffer.toString('hex');
}

function timestampHexToDate(timestampHex) {
  if (!timestampHex || typeof timestampHex !== 'string' || timestampHex.length < 8) {
    throw new Error('Invalid timestamp hex format');
  }

  const buffer = Buffer.from(timestampHex, 'hex');
  if (buffer.length < 4) {
    throw new Error('Buffer too small to read 32-bit integer');
  }

  const timestamp = buffer.readUInt32BE(0);

  return new Date(timestamp * 1000);
}
