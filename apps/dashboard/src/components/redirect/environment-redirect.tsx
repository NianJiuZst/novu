import { Navigate, useLocation } from 'react-router-dom';
import { useEnvironment } from '@/context/environment/hooks';
import { buildRoute, ROUTES } from '@/utils/routes';

export const EnvironmentRedirect = () => {
  const { currentEnvironment } = useEnvironment();
  const location = useLocation();
  
  if (!currentEnvironment) {
    // If no environment is available yet, don't redirect
    return null;
  }

  // Get the path without the leading slash
  const path = location.pathname.substring(1);
  
  // Map of direct paths to their environment-specific routes
  const pathMap: Record<string, string> = {
    'topics': ROUTES.TOPICS,
    'workflows': ROUTES.WORKFLOWS,
    'api-keys': ROUTES.API_KEYS,
    'environments': ROUTES.ENVIRONMENTS,
    'activity-feed': ROUTES.ACTIVITY_FEED,
    'subscribers': ROUTES.SUBSCRIBERS,
    'welcome': ROUTES.WELCOME,
  };

  // Check if the current path is in our map
  if (path in pathMap) {
    const targetRoute = pathMap[path];
    const redirectPath = buildRoute(targetRoute, { environmentSlug: currentEnvironment.slug });
    
    // Preserve any query parameters
    const search = location.search;
    
    return <Navigate to={`${redirectPath}${search}`} replace />;
  }

  // If the path is not in our map, don't redirect
  return null;
};

