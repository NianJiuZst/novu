import { IS_EE_AUTH_ENABLED, IS_SELF_HOSTED } from '../../../config';
import { FreeTrialSidebarWidget as Component } from '../../../ee/billing';

export const FreeTrialSidebarWidget = () => {
  if (IS_SELF_HOSTED) {
    return null;
  }

  return <Component />;
};
