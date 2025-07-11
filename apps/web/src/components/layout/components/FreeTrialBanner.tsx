import { IS_SELF_HOSTED } from '../../../config';
import { FreeTrialBanner as Component } from '../../../ee/billing';

export function FreeTrialBanner() {
  if (IS_SELF_HOSTED) {
    return null;
  }

  return <Component />;
}
