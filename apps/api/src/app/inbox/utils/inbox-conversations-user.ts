import { ApiAuthSchemeEnum, UserSessionData } from '@novu/shared';
import { SubscriberSession } from '../../shared/framework/user.decorator';

export function buildUserSessionForInboxConversations(subscriberSession: SubscriberSession): UserSessionData {
  return {
    _id: subscriberSession._id,
    firstName: subscriberSession.firstName,
    lastName: subscriberSession.lastName,
    email: subscriberSession.email,
    organizationId: subscriberSession.organizationId,
    environmentId: subscriberSession.environmentId,
    roles: [],
    permissions: [],
    scheme: subscriberSession.scheme ?? ApiAuthSchemeEnum.BEARER,
  };
}
