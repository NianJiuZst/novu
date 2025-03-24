import {
  CreateChange,
  GetLayoutUseCase,
  GetNovuLayout,
  GetSubscriberTemplatePreference,
} from '@novu/application-generic';
import { CommunityUserRepository, CommunityOrganizationRepository } from '@novu/dal';
import { GetNotifications } from './get-notifications/get-notifications.usecase';
import { GetInboxPreferences } from './get-inbox-preferences/get-inbox-preferences.usecase';
import { MarkManyNotificationsAs } from './mark-many-notifications-as/mark-many-notifications-as.usecase';
import { MarkNotificationAs } from './mark-notification-as/mark-notification-as.usecase';
import { NotificationsCount } from './notifications-count/notifications-count.usecase';
import { Session } from './session/session.usecase';
import { UpdateAllNotifications } from './update-all-notifications/update-all-notifications.usecase';
import { UpdateNotificationAction } from './update-notification-action/update-notification-action.usecase';
import { UpdatePreferences } from './update-preferences/update-preferences.usecase';
import { GetSubscriberGlobalPreference } from '../../subscribers/usecases/get-subscriber-global-preference';
import { GenerateUniqueApiKey } from '../../environments-v1/usecases/generate-unique-api-key/generate-unique-api-key.usecase';
import {
  CreateDefaultLayout,
  CreateLayoutChangeUseCase,
  CreateLayoutUseCase,
  FindDeletedLayoutUseCase,
  SetDefaultLayoutUseCase,
} from '../../layouts/usecases';
import { CreateDefaultLayoutChangeUseCase } from '../../layouts/usecases/create-default-layout-change/create-default-layout-change.usecase';

export const USE_CASES = [
  Session,
  NotificationsCount,
  GetNotifications,
  MarkManyNotificationsAs,
  MarkNotificationAs,
  UpdateNotificationAction,
  UpdateAllNotifications,
  GetInboxPreferences,
  GetSubscriberGlobalPreference,
  GetSubscriberTemplatePreference,
  UpdatePreferences,
  CommunityOrganizationRepository,
  CommunityUserRepository,
  GenerateUniqueApiKey,
  CreateDefaultLayout,
  SetDefaultLayoutUseCase,
  CreateLayoutUseCase,
  GetNovuLayout,
  GetLayoutUseCase,
  CreateDefaultLayoutChangeUseCase,
  CreateLayoutChangeUseCase,
  CreateChange,
  FindDeletedLayoutUseCase,
];
