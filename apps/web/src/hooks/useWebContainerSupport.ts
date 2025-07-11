import { useMemo } from 'react';
import { browserName, isChrome, isEdge } from 'react-device-detect';

export const useWebContainerSupported = () => {
  return useMemo(() => {
    const isBrave = browserName === 'Brave';
    const isSupported = isChrome || isEdge || isBrave;

    return { isSupported };
  }, []);
};
