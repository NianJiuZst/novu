import { Module } from '@nestjs/common';

import {
  CommunityOrganizationRepository,
  ControlValuesRepository,
  EnvironmentRepository,
  ExecutionDetailsRepository,
  IntegrationRepository,
  JobRepository,
  LayoutRepository,
  NotificationTemplateRepository,
} from '@novu/dal';
import { NovuClient, NovuHandler } from '@novu/framework/nest';
import { AnalyticsService, ClickHouseService, FeatureFlagsService, TraceLogRepository } from '../../services';
import { CreateExecutionDetails } from '../create-execution-details';
import { CreateVariablesObject } from '../create-variables-object/create-variables-object.usecase';
import { GetDecryptedSecretKey } from '../get-decrypted-secret-key';
import { GetLayoutV1Usecase as GetLayoutUseCaseV1 } from '../get-layout-v1';
import { GetOrganizationSettings } from '../get-organization-settings/get-organization-settings.usecase';
import { GetLayoutUseCase } from '../layouts-v2/get-layout';
import { LayoutVariablesSchemaUseCase } from '../layouts-v2/layout-variables-schema';
import { NovuBridgeController } from './novu-bridge.controller';
import { NovuBridgeClient } from './novu-bridge-client';
import { ConstructFrameworkWorkflow } from './usecases/construct-framework-workflow';
import {
  ChatOutputRendererUsecase,
  EmailOutputRendererUsecase,
  InAppOutputRendererUsecase,
  PushOutputRendererUsecase,
  SmsOutputRendererUsecase,
} from './usecases/output-renderers';
import { DelayOutputRendererUsecase } from './usecases/output-renderers/delay-output-renderer.usecase';
import { DigestOutputRendererUsecase } from './usecases/output-renderers/digest-output-renderer.usecase';

export const featureFlagsService = {
  provide: FeatureFlagsService,
  useFactory: async (): Promise<FeatureFlagsService> => {
    const instance = new FeatureFlagsService();
    await instance.initialize();

    return instance;
  },
};

@Module({
  controllers: [NovuBridgeController],
  providers: [
    {
      provide: NovuClient,
      useClass: NovuBridgeClient,
    },
    NovuHandler,
    EnvironmentRepository,
    NotificationTemplateRepository,
    CommunityOrganizationRepository,
    IntegrationRepository,
    ControlValuesRepository,
    LayoutRepository,
    GetOrganizationSettings,
    ConstructFrameworkWorkflow,
    GetDecryptedSecretKey,
    InAppOutputRendererUsecase,
    EmailOutputRendererUsecase,
    SmsOutputRendererUsecase,
    ChatOutputRendererUsecase,
    PushOutputRendererUsecase,
    DelayOutputRendererUsecase,
    DigestOutputRendererUsecase,
    AnalyticsService,
    GetLayoutUseCaseV1,
    LayoutVariablesSchemaUseCase,
    CreateVariablesObject,
    GetLayoutUseCase,
    JobRepository,
    ExecutionDetailsRepository,
    TraceLogRepository,
    ClickHouseService,
    CreateExecutionDetails,
    featureFlagsService,
  ],
})
export class NovuBridgeModule {}
