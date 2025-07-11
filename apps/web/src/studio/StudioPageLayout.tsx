import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LocalStudioPageLayout } from '../components/layout/components/LocalStudioPageLayout';
import { PrivatePageLayout } from '../components/layout/components/PrivatePageLayout';
import { ROUTES } from '../constants/routes';
import { useStudioState } from './StudioStateProvider';

export function StudioPageLayout() {
  const state = useStudioState();
  const { pathname } = useLocation();

  useEffect(() => {
    onPathnameChangeUpdateIframeClient(pathname);
  }, [pathname]);

  if (pathname.startsWith(ROUTES.STUDIO_ONBOARDING)) {
    return <Outlet />;
  }

  if (state?.isLocalStudio) {
    return <LocalStudioPageLayout />;
  }

  return <PrivatePageLayout />;
}

function onPathnameChangeUpdateIframeClient(pathname: string) {
  window.parent.postMessage({ type: 'pathnameChange', pathname }, '*');
}
