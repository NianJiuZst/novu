import { EnvironmentTypeEnum, type IEnvironment } from '@novu/shared';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/auth/hooks';
import { EnvironmentContext } from '@/context/environment/environment-context';
import { useFetchEnvironments } from '@/context/environment/hooks';
import { useIsLocalStudio } from '@/context/studio/hooks';
import { loadFromStorage, saveToStorage } from '@/utils/local-storage';
import { buildRoute, ROUTES } from '@/utils/routes';

const PRODUCTION_ENVIRONMENT = 'Production';
const DEVELOPMENT_ENVIRONMENT = 'Development';
const LOCAL_ENVIRONMENT = 'Local';
const LAST_SELECTED_ENVIRONMENT_STORAGE_KEY = 'novu-last-selected-environment';

function selectEnvironment(
  environments: IEnvironment[],
  selectedEnvironmentSlug?: string | null,
  organizationId?: string,
  isLocalStudio?: boolean
) {
  let environment: IEnvironment | undefined;

  if (isLocalStudio) {
    environment = environments.find((env) => env.slug === 'local');
    if (environment) {
      return environment;
    }
  }

  if (selectedEnvironmentSlug) {
    environment = environments.find((env) => env.slug === selectedEnvironmentSlug);
  }

  if (!environment && organizationId) {
    const lastSelectedSlug = loadFromStorage<string>(
      `${LAST_SELECTED_ENVIRONMENT_STORAGE_KEY}-${organizationId}`,
      'environmentSlug'
    );
    if (lastSelectedSlug) {
      environment = environments.find((env) => env.slug === lastSelectedSlug);
    }
  }

  if (!environment) {
    environment = environments.find((env) => env.name === DEVELOPMENT_ENVIRONMENT);
  }

  if (!environment) {
    throw new Error('Missing development environment');
  }

  return environment;
}

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { environmentSlug: paramsEnvironmentSlug } = useParams<{ environmentSlug?: string }>();
  const [currentEnvironment, setCurrentEnvironment] = useState<IEnvironment>();
  const isLocalStudio = useIsLocalStudio();

  const switchEnvironmentInternal = useCallback(
    (allEnvironments: IEnvironment[], environmentSlug?: string | null) => {
      const selectedEnvironment = selectEnvironment(
        allEnvironments,
        environmentSlug,
        currentOrganization?._id,
        isLocalStudio
      );
      setCurrentEnvironment(selectedEnvironment);
      const newEnvironmentSlug = selectedEnvironment.slug;
      const isNewEnvironmentDifferent = paramsEnvironmentSlug !== selectedEnvironment.slug;

      if (currentOrganization?._id && newEnvironmentSlug && newEnvironmentSlug !== 'local') {
        saveToStorage(
          `${LAST_SELECTED_ENVIRONMENT_STORAGE_KEY}-${currentOrganization._id}`,
          newEnvironmentSlug,
          'environmentSlug'
        );
      }

      if (newEnvironmentSlug === 'local') {
        if (pathname !== ROUTES.STUDIO && !pathname.startsWith(ROUTES.STUDIO + '/')) {
          const searchParams = new URLSearchParams(window.location.search);
          navigate({
            pathname: ROUTES.STUDIO,
            search: searchParams.toString(),
          });
        }

        return;
      }

      if (pathname === ROUTES.ROOT || pathname === ROUTES.ENV || pathname === `${ROUTES.ENV}/`) {
        navigate(buildRoute(ROUTES.WORKFLOWS, { environmentSlug: newEnvironmentSlug ?? '' }));
      } else if (pathname.includes(ROUTES.ENV) && isNewEnvironmentDifferent) {
        const newPath = pathname.replace(/\/env\/[^/]+(\/|$)/, `${ROUTES.ENV}/${newEnvironmentSlug}$1`);
        navigate(newPath);
      }
    },
    [navigate, pathname, paramsEnvironmentSlug, currentOrganization?._id, isLocalStudio]
  );

  const { environments: fetchedEnvironments, areEnvironmentsInitialLoading } = useFetchEnvironments({
    organizationId: currentOrganization?._id,
    showError: false,
  });

  const environments = useMemo(() => {
    if (!fetchedEnvironments) {
      return fetchedEnvironments;
    }

    if (isLocalStudio && currentOrganization) {
      const localEnvironment: IEnvironment = {
        _id: 'local-studio-virtual',
        name: LOCAL_ENVIRONMENT,
        slug: 'local',
        _organizationId: currentOrganization._id,
        identifier: 'local',
        type: EnvironmentTypeEnum.DEV,
        createdAt: new Date(),
        updatedAt: new Date(),
        widget: { notificationCenterEncryption: false },
        color: '#7c3aed',
      };

      return [localEnvironment, ...fetchedEnvironments];
    }

    return fetchedEnvironments;
  }, [fetchedEnvironments, isLocalStudio, currentOrganization]);

  useLayoutEffect(() => {
    if (!environments) {
      return;
    }

    const environmentId = paramsEnvironmentSlug;
    switchEnvironmentInternal(environments, environmentId);
  }, [paramsEnvironmentSlug, environments, switchEnvironmentInternal]);

  const switchEnvironment = useCallback(
    (newEnvironmentSlug?: string) => {
      if (!environments) {
        return;
      }

      switchEnvironmentInternal(environments, newEnvironmentSlug);
    },
    [switchEnvironmentInternal, environments]
  );

  const setBridgeUrl = useCallback(
    (url: string) => {
      if (!currentEnvironment) {
        return;
      }

      setCurrentEnvironment({ ...currentEnvironment, bridge: { url } });
    },
    [currentEnvironment]
  );

  const oppositeEnvironment = useMemo((): IEnvironment | null => {
    if (!currentEnvironment || !environments) {
      return null;
    }

    const oppositeEnvironmentName =
      currentEnvironment.name === PRODUCTION_ENVIRONMENT ? DEVELOPMENT_ENVIRONMENT : PRODUCTION_ENVIRONMENT;

    return environments?.find((env) => env.name === oppositeEnvironmentName) || null;
  }, [currentEnvironment, environments]);

  const value = useMemo(
    () => ({
      currentEnvironment,
      environments,
      areEnvironmentsInitialLoading,
      readOnly: currentEnvironment?._parentId !== undefined,
      oppositeEnvironment,
      switchEnvironment,
      setBridgeUrl,
    }),
    [
      currentEnvironment,
      environments,
      areEnvironmentsInitialLoading,
      oppositeEnvironment,
      switchEnvironment,
      setBridgeUrl,
    ]
  );

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}
