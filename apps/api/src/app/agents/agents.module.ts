import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChannelConnectionsModule } from '../channel-connections/channel-connections.module';
import { ChannelEndpointsModule } from '../channel-endpoints/channel-endpoints.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { SharedModule } from '../shared/shared.module';
import { SubscribersV1Module } from '../subscribers/subscribersV1.module';
import { AgentWebhooksController } from './agent-webhooks.controller';
import { AgentsController } from './agents.controller';
import { AgentChatService } from './services/agent-chat.service';
import { AgentSubscriberResolverService } from './services/agent-subscriber-resolver.service';
import { USE_CASES } from './usecases';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    ConversationsModule,
    ChannelEndpointsModule,
    ChannelConnectionsModule,
    SubscribersV1Module,
  ],
  providers: [...USE_CASES, AgentSubscriberResolverService, AgentChatService],
  controllers: [AgentsController, AgentWebhooksController],
  exports: [...USE_CASES],
})
export class AgentsModule {}
