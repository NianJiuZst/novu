import React from 'react';
import type { AuthContextValue } from './types';

export const AuthContext = React.createContext<AuthContextValue>({} as AuthContextValue);
AuthContext.displayName = 'AuthContext';
