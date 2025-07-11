import { UserButton } from '@clerk/clerk-react';
import { IconBolt } from '@novu/novui/icons';
import { WEB_APP_URL } from '../../../config';
import { ROUTES } from '../../../constants/routes';
import { useNewDashboardOptIn } from '../../../hooks/useNewDashboardOptIn';

export function UserProfileButton() {
  const { optIn } = useNewDashboardOptIn();

  return (
    <UserButton
      afterSignOutUrl={`${WEB_APP_URL}${ROUTES.AUTH_LOGIN}`}
      userProfileUrl={ROUTES.MANAGE_ACCOUNT_USER_PROFILE}
    >
      <UserButton.MenuItems>
        <UserButton.Action
          label="Try out the new V2 Dashboard"
          labelIcon={<IconBolt size="16" color="var(--nv-colors-typography-text-main)" />}
          onClick={optIn}
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
