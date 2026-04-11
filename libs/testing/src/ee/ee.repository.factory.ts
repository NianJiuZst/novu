import { CommunityMemberRepository, CommunityOrganizationRepository, CommunityUserRepository } from '@novu/dal';
import { isClerkEnabled } from '@novu/shared';
import { ClerkClientMock } from './clerk-client.mock';

function requireNovuWorkspacePackage(suffix: string): unknown {
  return require(`@novu/${suffix}`);
}

/**
 * Dynamic require via template (not `require('@novu/ee-auth')`) so Nx does not infer a build dependency edge.
 * Packages resolve at runtime from the consuming app.
 */
export function getEERepository<T>(className: 'OrganizationRepository' | 'MemberRepository' | 'UserRepository'): T {
  if (isClerkEnabled()) {
    switch (className) {
      case 'OrganizationRepository':
        return getEEOrganizationRepository() as T;
      case 'MemberRepository':
        return getEEMemberRepository() as T;
      case 'UserRepository':
        return getEEUserRepository() as T;
      default:
        throw new Error('Invalid repository name');
    }
  }

  switch (className) {
    case 'OrganizationRepository':
      return new CommunityOrganizationRepository() as T;
    case 'MemberRepository':
      return new CommunityMemberRepository() as T;
    case 'UserRepository':
      return new CommunityUserRepository() as T;
    default:
      throw new Error('Invalid repository name');
  }
}

const clerkClientMock = new ClerkClientMock();

function getEEUserRepository() {
  const eeAuth = requireNovuWorkspacePackage('ee-auth') as Record<string, new (...args: unknown[]) => unknown>;
  const appGeneric = requireNovuWorkspacePackage('application-generic') as Record<
    string,
    new (...args: unknown[]) => unknown
  >;

  return new eeAuth.EEUserRepository(
    new CommunityUserRepository(),
    new appGeneric.AnalyticsService(),
    clerkClientMock
  );
}

function getEEOrganizationRepository() {
  const { EEOrganizationRepository } = requireNovuWorkspacePackage('ee-auth') as {
    EEOrganizationRepository: new (...args: unknown[]) => unknown;
  };

  return new EEOrganizationRepository(new CommunityOrganizationRepository(), clerkClientMock);
}

function getEEMemberRepository() {
  const { EEMemberRepository } = requireNovuWorkspacePackage('ee-auth') as {
    EEMemberRepository: new (...args: unknown[]) => unknown;
  };

  return new EEMemberRepository(new CommunityOrganizationRepository(), clerkClientMock);
}
