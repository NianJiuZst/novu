import { useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { Aside } from './Aside';
import { RootNavMenu } from './RootNavMenu';
import { SettingsNavMenu } from './SettingsNavMenu';

export const Sidebar = () => {
  const { pathname } = useLocation();

  return <Aside>{pathname.startsWith(ROUTES.SETTINGS) ? <SettingsNavMenu /> : <RootNavMenu />}</Aside>;
};
