import { useContext } from 'react';
import { StudioStateContext } from './studio-state-context';

export function useStudioState() {
  const context = useContext(StudioStateContext);

  if (context === undefined) {
    throw new Error('useStudioState must be used within a StudioStateProvider');
  }

  return context;
}

export function useIsLocalStudio(): boolean {
  const state = useStudioState();

  return state.isLocalStudio === true;
}
