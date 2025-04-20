import { Module } from '@nestjs/common';
import {
  analyticsService,
  CacheInMemoryProviderService,
  cacheService,
  CreateOrUpdateSubscriberUseCase,
  ExecuteBridgeRequest,
  featureFlagsService,
  GetDecryptedSecretKey,
  GetPreferences,
  GetSubscriber,
  GetSubscriberTemplatePreference,
  GetWorkflowByIdsUseCase,
  InvalidateCacheService,
  UpdateSubscriber,
  UpdateSubscriberChannel,
  UpsertPreferences,
} from '@novu/application-generic';
import {
  CommunityOrganizationRepository,
  EnvironmentRepository,
  IntegrationRepository,
  MessageTemplateRepository,
  NotificationTemplateRepository,
  PreferencesRepository,
  SubscriberRepository,
  TenantRepository,
  TopicSubscribersRepository,
  WorkflowOverrideRepository,
} from '@novu/dal';
import { UpdatePreferences } from '../inbox/usecases/update-preferences/update-preferences.usecase';
import { GetSubscriberGlobalPreference } from '../subscribers/usecases/get-subscriber-global-preference';
import { GetSubscriberPreference } from '../subscribers/usecases/get-subscriber-preference';
import { SubscribersController } from './subscribers.controller';
import { GetSubscriberPreferences } from './usecases/get-subscriber-preferences/get-subscriber-preferences.usecase';
import { ListSubscribersUseCase } from './usecases/list-subscribers/list-subscribers.usecase';
import { PatchSubscriber } from './usecases/patch-subscriber/patch-subscriber.usecase';
import { RemoveSubscriber } from './usecases/remove-subscriber/remove-subscriber.usecase';
import { UpdateSubscriberPreferences } from './usecases/update-subscriber-preferences/update-subscriber-preferences.usecase';

const USE_CASES = [
  ListSubscribersUseCase,
  CreateOrUpdateSubscriberUseCase,
  UpdateSubscriber,
  UpdateSubscriberChannel,
  IntegrationRepository,
  GetDecryptedSecretKey,
  CacheInMemoryProviderService,
  ExecuteBridgeRequest,
  UpdateSubscriber,
  UpdateSubscriberChannel,
  IntegrationRepository,
  CacheInMemoryProviderService,
  GetSubscriber,
  PatchSubscriber,
  RemoveSubscriber,
  GetSubscriberPreferences,
  GetSubscriberGlobalPreference,
  GetSubscriberPreference,
  GetPreferences,
  UpdateSubscriberPreferences,
  UpdatePreferences,
  GetSubscriberTemplatePreference,
  UpsertPreferences,
  GetWorkflowByIdsUseCase,
];

const DAL_MODELS = [
  SubscriberRepository,
  NotificationTemplateRepository,
  PreferencesRepository,
  TopicSubscribersRepository,
  MessageTemplateRepository,
  WorkflowOverrideRepository,
  TenantRepository,
];

@Module({
  controllers: [SubscribersController],
  providers: [
    ...USE_CASES,
    ...DAL_MODELS,
    cacheService,
    InvalidateCacheService,
    analyticsService,
    CommunityOrganizationRepository,
    featureFlagsService,
    EnvironmentRepository,
  ],
})
export class SubscribersModule {}
