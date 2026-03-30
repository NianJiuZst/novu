import { ApiAuthSchemeEnum, MemberRoleEnum, PermissionsEnum, UserSessionData } from '@novu/shared';

export function buildAgentWebhookUserSession(organizationId: string, environmentId: string): UserSessionData {
  return {
    _id: 'agent-webhook-internal',
    organizationId,
    environmentId,
    roles: [MemberRoleEnum.ADMIN],
    permissions: Object.values(PermissionsEnum),
    scheme: ApiAuthSchemeEnum.API_KEY,
  };
}
