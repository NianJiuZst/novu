import { createContext } from 'react';
import type { PayloadSchemaContextType } from './payload-schema.types';

export const PayloadSchemaContext = createContext<PayloadSchemaContextType | undefined>(undefined);
