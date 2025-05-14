import { Navigate, useLocation } from 'react-router-dom';
import { buildRoute, ROUTES } from '@/utils/routes';
import { useEnvironment } from '@/context/environment/hooks';

interface RedirectToEnvironmentProps {
  targetRoute: string;
}

export const RedirectToEnvironment = ({ targetRoute }: RedirectToEnvironmentProps) => {
  const { currentEnvironment } = useEnvironment();
  const location = useLocation();

  if (!currentEnvironment?.slug) {
    return <Navigate to={ROUTES.ROOT} />;
  }

  const targetPath = buildRoute(targetRoute, { environmentSlug: currentEnvironment.slug });
  
  const queryParams = location.search;
  const hash = location.hash;
  
  return <Navigate to={`${targetPath}${queryParams}${hash}`} />;
};
