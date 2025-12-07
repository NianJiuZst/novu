import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth/hooks';
import { useFetchEnvironments } from '@/context/environment/hooks';
import { StudioState } from '@/types/studio';
import { encodeBase64 } from '@/utils/base64';
import { novuOnboardedCookie } from '@/utils/cookies';
import { ROUTES } from '@/utils/routes';
import { assertProtocol } from '@/utils/url';

function buildBridgeURL(origin: string | null, tunnelPath: string) {
  if (!origin) {
    return '';
  }

  return new URL(tunnelPath, origin).href;
}

function buildStudioURL(state: StudioState, defaultPath?: string | null) {
  const url = new URL(defaultPath || '/studio', window.location.origin);
  url.searchParams.append('state', encodeBase64(state));

  return url.href;
}

export function LocalStudioAuthenticator() {
  const { currentUser, isUserLoaded, currentOrganization, isOrganizationLoaded } = useAuth();
  const location = useLocation();
  const { environments, areEnvironmentsInitialLoading } = useFetchEnvironments({
    organizationId: currentOrganization?._id,
  });

  const isLoading = !isUserLoaded || !isOrganizationLoaded || areEnvironmentsInitialLoading;

  useEffect(() => {
    const parsedSearchParams = new URLSearchParams(location.search);
    const anonymousId = parsedSearchParams.get('anonymous_id');

    const redirectURL = parsedSearchParams.get('redirect_url');

    if (!redirectURL) {
      throw new Error('Failed to load Local Studio: missing redirect_url parameter.');
    }

    const parsedRedirectURL = new URL(redirectURL);

    assertProtocol(parsedRedirectURL);

    const currentURL = new URL(window.location.href);

    if (!currentUser) {
      if (!isLoading) {
        if (novuOnboardedCookie.get()) {
          const signInUrl = new URL(ROUTES.SIGN_IN, window.location.origin);
          signInUrl.searchParams.append('redirect_url', window.location.href);
          window.location.replace(signInUrl.href);

          return;
        }

        const signUpUrl = new URL(ROUTES.SIGN_UP, window.location.origin);
        signUpUrl.searchParams.append('redirect_url', currentURL.href);
        if (anonymousId) {
          signUpUrl.searchParams.append('anonymous_id', anonymousId);
        }
        signUpUrl.searchParams.append('origin', 'cli');
        window.location.replace(signUpUrl.href);

        return;
      }

      return;
    }

    if (!environments || environments.length === 0) {
      return;
    }

    const applicationOrigin = parsedSearchParams.get('application_origin');

    if (!applicationOrigin) {
      throw new Error('Failed to load Local Studio: missing application_origin parameter.');
    }

    const parsedApplicationOrigin = new URL(applicationOrigin);

    assertProtocol(parsedApplicationOrigin);

    const tunnelOrigin = parsedSearchParams.get('tunnel_origin');
    const tunnelPath = parsedSearchParams.get('tunnel_route');

    if (!tunnelPath) {
      throw new Error('Tunnel Path is not defined');
    }

    assertProtocol(tunnelOrigin);

    const localBridgeURL = buildBridgeURL(parsedApplicationOrigin.origin, tunnelPath);
    const tunnelBridgeURL = buildBridgeURL(tunnelOrigin, tunnelPath);

    const devSecretKey = (environments.find((env) => env.name.toLowerCase() === 'development') as any)?.apiKeys?.[0]
      ?.key;

    if (environments.length > 0 && !devSecretKey) {
      throw new Error('Failed to load Local Studio: missing development environment secret key.');
    }

    const state: StudioState = {
      isLocalStudio: true,
      devSecretKey,
      testUser: {
        id: currentUser._id,
        emailAddress: currentUser.email || '',
        firstName: currentUser.firstName || undefined,
        lastName: currentUser.lastName || undefined,
      },
      localBridgeURL,
      tunnelBridgeURL,
      organizationName: currentOrganization?.name || '',
      anonymousId,
    };

    const finalRedirectURL = new URL(redirectURL);
    finalRedirectURL.searchParams.append(
      'local_studio_url',
      buildStudioURL(state, currentURL.searchParams.get('studio_path_hint'))
    );

    window.location.href = finalRedirectURL.href;
  }, [currentUser, environments, isLoading, location.search, currentOrganization]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-foreground-600">Loading Local Studio...</div>
    </div>
  );
}
