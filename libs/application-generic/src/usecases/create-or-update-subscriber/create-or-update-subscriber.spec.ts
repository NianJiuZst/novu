import { Test } from '@nestjs/testing';
import { CommunityOrganizationRepository, EnvironmentRepository, SubscriberRepository } from '@novu/dal';
import { UserSession } from '@novu/testing';
import {
  AnalyticsService,
  CacheInMemoryProviderService,
  CacheService,
  FeatureFlagsService,
  InvalidateCacheService,
} from '../../services';
import { PinoLogger } from '../../logging';
import { UpdateSubscriberChannel } from '../subscribers';
import { UpdateSubscriber } from '../update-subscriber';
import { CreateOrUpdateSubscriberCommand } from './create-or-update-subscriber.command';
import { CreateOrUpdateSubscriberUseCase } from './create-or-update-subscriber.usecase';

const cacheInMemoryProviderService = {
  provide: CacheInMemoryProviderService,
  useFactory: async (): Promise<CacheInMemoryProviderService> => {
    return new CacheInMemoryProviderService();
  },
};

const cacheService = {
  provide: CacheService,
  useFactory: async () => {
    const factoryCacheInMemoryProviderService = await cacheInMemoryProviderService.useFactory();

    const service = new CacheService(factoryCacheInMemoryProviderService);
    await service.initialize();

    return service;
  },
};

describe('Create Subscriber', () => {
  let useCase: CreateOrUpdateSubscriberUseCase;
  let session: UserSession;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [SubscriberRepository, InvalidateCacheService],
      providers: [
        CreateOrUpdateSubscriberUseCase,
        UpdateSubscriber,
        UpdateSubscriberChannel,
        AnalyticsService,
        cacheInMemoryProviderService,
        cacheService,
        EnvironmentRepository,
        CommunityOrganizationRepository,
        {
          provide: FeatureFlagsService,
          useValue: {
            getFlag: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: PinoLogger,
          useValue: {
            setContext: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    session = new UserSession();
    await session.initialize();

    useCase = moduleRef.get<CreateOrUpdateSubscriberUseCase>(CreateOrUpdateSubscriberUseCase);
  });

  it('should create a subscriber', async () => {
    const locale = 'en';
    const result = await useCase.execute(
      CreateOrUpdateSubscriberCommand.create({
        organizationId: session.organization._id,
        environmentId: session.environment._id,
        subscriberId: '1234',
        email: 'dima@asdasdas.com',
        firstName: 'ASDAS',
        locale,
      })
    );

    expect(result.locale).toEqual(locale);
  });

  it('should update the subscriber when same id provided', async () => {
    const subscriberId = '1234';
    const email = 'dima@asdasdas.com';
    const noLocale = 'no';

    await useCase.execute(
      CreateOrUpdateSubscriberCommand.create({
        organizationId: session.organization._id,
        environmentId: session.environment._id,
        subscriberId,
        email,
        firstName: 'First Name',
        locale: 'en',
      })
    );

    const result = await useCase.execute(
      CreateOrUpdateSubscriberCommand.create({
        organizationId: session.organization._id,
        environmentId: session.environment._id,
        subscriberId,
        email,
        firstName: 'Second Name',
        locale: noLocale,
      })
    );

    expect(result.firstName).toEqual('Second Name');
    expect(result.locale).toEqual(noLocale);
  });
});
