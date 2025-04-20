import {
  CreateOrUpdateSubscriberUseCase,
  GetSubscriber,
  GetSubscriberTemplatePreference,
  UpdateSubscriber,
  UpdateSubscriberChannel,
} from '@novu/application-generic';

import { UpdatePreferences } from '../../inbox/usecases/update-preferences/update-preferences.usecase';
import { CheckIntegrationEMail } from '../../integrations/usecases/check-integration/check-integration-email.usecase';
import { CheckIntegration } from '../../integrations/usecases/check-integration/check-integration.usecase';
import { CreateIntegration } from '../../integrations/usecases/create-integration/create-integration.usecase';
import { BulkCreateSubscribers } from './bulk-create-subscribers/bulk-create-subscribers.usecase';
import { ChatOauthCallback } from './chat-oauth-callback/chat-oauth-callback.usecase';
import { ChatOauth } from './chat-oauth/chat-oauth.usecase';
import { DeleteSubscriberCredentials } from './delete-subscriber-credentials/delete-subscriber-credentials.usecase';
import { GetPreferencesByLevel } from './get-preferences-by-level/get-preferences-by-level.usecase';
import { GetSubscriberV1 } from './get-subscriber';
import { GetSubscriberGlobalPreference } from './get-subscriber-global-preference/get-subscriber-global-preference.usecase';
import { GetSubscriberPreference } from './get-subscriber-preference/get-subscriber-preference.usecase';
import { GetSubscribers } from './get-subscribers';
import { RemoveSubscriber } from './remove-subscriber';
import { SearchByExternalSubscriberIds } from './search-by-external-subscriber-ids';
import { UpdateSubscriberOnlineFlag } from './update-subscriber-online-flag';

export {
  SearchByExternalSubscriberIds,
  SearchByExternalSubscriberIdsCommand,
} from './search-by-external-subscriber-ids';

export const USE_CASES = [
  CreateOrUpdateSubscriberUseCase,
  GetSubscribers,
  GetSubscriber,
  GetSubscriberV1,
  GetSubscriberPreference,
  GetSubscriberTemplatePreference,
  GetPreferencesByLevel,
  RemoveSubscriber,
  SearchByExternalSubscriberIds,
  UpdateSubscriber,
  UpdateSubscriberChannel,
  UpdateSubscriberOnlineFlag,
  ChatOauthCallback,
  ChatOauth,
  DeleteSubscriberCredentials,
  BulkCreateSubscribers,
  GetSubscriberGlobalPreference,
  CreateIntegration,
  CheckIntegration,
  CheckIntegrationEMail,
  UpdatePreferences,
];
