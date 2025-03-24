import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
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
  NotificationGroupRepository,
  OrganizationRepository,
} from '@novu/dal';
import { ChannelTypeEnum, EnvironmentEnum, InAppProviderIdEnum, PROTECTED_ENVIRONMENTS } from '@novu/shared';
import { nanoid } from 'nanoid';
import { ApiException } from '../../../shared/exceptions/api.exception';
import { SubscriberSessionResponseDto } from '../../dtos/subscriber-session-response.dto';
import { AnalyticsEventsEnum } from '../../utils';
import { validateHmacEncryption } from '../../utils/encryption';
import { NotificationsCountCommand } from '../notifications-count/notifications-count.command';
import { NotificationsCount } from '../notifications-count/notifications-count.usecase';
import { SessionCommand } from './session.command';
import { CreateEnvironmentCommand } from '../../../environments-v1/usecases/create-environment/create-environment.command';
import { GenerateUniqueApiKey } from '../../../environments-v1/usecases/generate-unique-api-key/generate-unique-api-key.usecase';
import { CreateDefaultLayout, CreateDefaultLayoutCommand } from '../../../layouts/usecases';
import { CreateNovuIntegrations } from '../../../integrations/usecases/create-novu-integrations/create-novu-integrations.usecase';
import { CreateNovuIntegrationsCommand } from '../../../integrations/usecases/create-novu-integrations/create-novu-integrations.command';
import { EnvironmentResponseDto } from '../../../environments-v1/dtos/environment-response.dto';

@Injectable()
export class Session {
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
    private createDefaultLayoutUsecase: CreateDefaultLayout,
    private createNovuIntegrationsUsecase: CreateNovuIntegrations,
    private notificationGroupRepository: NotificationGroupRepository,
    private communityUserRepository: CommunityUserRepository,
    private logger: PinoLogger
  ) {}

  @LogDecorator()
  async execute(command: SessionCommand): Promise<SubscriberSessionResponseDto> {
    const isSandbox = !command.applicationIdentifier;
    this.logger.error('Session.execute called', command);

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

    // if applicationIdentifier is not provided, we will use the created environment

    /*
     * if applicationIdentifier is provided and its Sandbox application we will check its expiration date
     * if it's expired, we will use the created environment
     * if it's not expired, we will use the provided applicationIdentifier
     */

    // else we will use the created environment as bellow

    const applicationIdentifier =
      command.applicationIdentifier || (await this.processSandbox(organization._id, user._id)).identifier;

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
    const isOriginFromNovu =
      command.origin &&
      ((process.env.DASHBOARD_V2_BASE_URL && command.origin?.includes(process.env.DASHBOARD_V2_BASE_URL as string)) ||
        (process.env.FRONT_BASE_URL && command.origin?.includes(process.env.FRONT_BASE_URL as string)));

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
      ...(isSandbox ? { applicationIdentifier: environment.identifier } : {}),
      token,
      totalUnreadCount,
      removeNovuBranding,
      isDevelopmentMode: environment.name.toLowerCase() !== 'production',
    };
  }

  async processSandbox(organizationId: string, userId: string): Promise<EnvironmentResponseDto> {
    const key = `sk_${await this.generateUniqueApiKey.execute()}`;
    const encryptedApiKey = encryptApiKey(key);
    const hashedApiKey = createHash('sha256').update(key).digest('hex');

    const encodedDate = dateToTimestampHex(new Date());
    const identifier = `pk_sandbox_${encodedDate}_${shortId(4)}`;
    const environment = await this.environmentRepository.create({
      _organizationId: organizationId,
      name: `Sandbox ${new Date().toLocaleDateString()}`,
      identifier,
      apiKeys: [
        {
          key: encryptedApiKey,
          _userId: userId,
          hash: hashedApiKey,
        },
      ],
    });

    await this.createNovuIntegrationsUsecase.execute(
      CreateNovuIntegrationsCommand.create({
        environmentId: environment._id,
        organizationId: environment._organizationId,
        userId,
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

  private encodeMongoTimestamp(timestamp: number): string {
    const seconds = Math.floor(timestamp / 1000);

    return Buffer.from(seconds.toString(16).padStart(8, '0'), 'hex').toString('base64');
  }

  private decodeMongoTimestamp(encodedTimestamp: string): number {
    const buffer = Buffer.from(encodedTimestamp, 'base64');

    return parseInt(buffer.toString('hex'), 16) * 1000; // Convert back to milliseconds
  }
}

// Generate timestamp portion of ObjectId
function generateTimestampHex() {
  const now = new Date();
  const timeInSeconds = Math.floor(now.getTime() / 1000);
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(timeInSeconds, 0);

  return buffer.toString('hex');
}

// Convert Date to ObjectId timestamp bytes
function dateToTimestampHex(date) {
  const timeInSeconds = Math.floor(date.getTime() / 1000);
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(timeInSeconds, 0);

  return buffer.toString('hex');
}

// Convert timestamp hex to Date
function timestampHexToDate(timestampHex) {
  const buffer = Buffer.from(timestampHex, 'hex');
  const timestamp = buffer.readUInt32BE(0);

  return new Date(timestamp * 1000);
}
