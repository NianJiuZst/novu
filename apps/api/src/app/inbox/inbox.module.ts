import { Module } from '@nestjs/common';
import {
  CommunityOrganizationRepository,
  ContextRepository,
  NotificationTemplateRepository,
  SubscriberRepository,
  TopicRepository,
  TopicSubscribersRepository,
} from '@novu/dal';
import { AuthModule } from '../auth/auth.module';
import { IntegrationModule } from '../integrations/integrations.module';
import { OrganizationModule } from '../organization/organization.module';
import { OutboundWebhooksModule } from '../outbound-webhooks/outbound-webhooks.module';
import { PreferencesModule } from '../preferences';
import { SharedModule } from '../shared/shared.module';
import { SubscribersV1Module } from '../subscribers/subscribersV1.module';
import { TopicsV2Module } from '../topics-v2/topics-v2.module';
import { CreateTopicSubscriptionsUsecase } from '../topics-v2/usecases/create-topic-subscriptions/create-topic-subscriptions.usecase';
import { UpdateTopicSubscriptionUsecase } from '../topics-v2/usecases/update-topic-subscription/update-topic-subscription.usecase';
import { UpsertTopicUseCase } from '../topics-v2/usecases/upsert-topic/upsert-topic.usecase';
import { InboxController } from './inbox.controller';
import { USE_CASES } from './usecases';

@Module({
  imports: [
    SharedModule,
    SubscribersV1Module,
    AuthModule,
    IntegrationModule,
    PreferencesModule,
    OrganizationModule,
    OutboundWebhooksModule.forRoot(),
    TopicsV2Module,
  ],
  providers: [
    ...USE_CASES,
    CommunityOrganizationRepository,
    ContextRepository,
    TopicRepository,
    TopicSubscribersRepository,
    NotificationTemplateRepository,
    SubscriberRepository,
    UpsertTopicUseCase,
    CreateTopicSubscriptionsUsecase,
    UpdateTopicSubscriptionUsecase,
  ],
  exports: [...USE_CASES],
  controllers: [InboxController],
})
export class InboxModule {}
