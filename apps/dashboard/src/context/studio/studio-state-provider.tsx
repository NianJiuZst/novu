import { ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { StudioState } from '@/types/studio';
import { decodeBase64 } from '@/utils/base64';
import { StudioStateContext, StudioStateContextValue } from './studio-state-context';

export function StudioStateProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const state = useMemo<StudioStateContextValue>(() => {
    try {
      const stateParam = new URLSearchParams(location.search).get('state');

      if (stateParam) {
        const decoded = decodeBase64<StudioState>(stateParam);

        return decoded;
      }
    } catch (error) {
      console.error('Failed to decode studio state:', error);
    }

    return { isLocalStudio: false };
  }, [location.search]);

  return <StudioStateContext.Provider value={state}>{children}</StudioStateContext.Provider>;
}
