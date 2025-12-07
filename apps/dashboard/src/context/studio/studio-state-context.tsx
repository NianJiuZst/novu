import React from 'react';
import { StudioState } from '@/types/studio';

export type StudioStateContextValue = StudioState | { isLocalStudio: false };

export const StudioStateContext = React.createContext<StudioStateContextValue | undefined>(undefined);
StudioStateContext.displayName = 'StudioStateContext';
