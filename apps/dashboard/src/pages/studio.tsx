import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeaderNavigation } from '@/components/header-navigation/header-navigation';
import { SideNavigation } from '@/components/side-navigation/side-navigation';
import { useIsLocalStudio } from '@/context/studio/hooks';
import { ROUTES } from '@/utils/routes';

export function StudioPage() {
  const isLocalStudio = useIsLocalStudio();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLocalStudio) {
      navigate(ROUTES.ROOT, { replace: true });
    }
  }, [isLocalStudio, navigate]);

  if (!isLocalStudio) {
    return null;
  }

  return (
    <div className="flex h-screen w-full">
      <SideNavigation />
      <div className="flex flex-1 flex-col">
        <HeaderNavigation />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-foreground text-3xl font-bold">Welcome to Local Studio</h1>
            <p className="text-foreground-600 text-lg">Hello World from Novu Local Studio</p>
          </div>
        </main>
      </div>
    </div>
  );
}
