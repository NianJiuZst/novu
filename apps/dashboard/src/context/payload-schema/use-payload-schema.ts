import { useContext } from 'react';
import { PayloadSchemaContext } from './payload-schema.context';
import type { PayloadSchemaContextType } from './payload-schema.types';

export function usePayloadSchema(): PayloadSchemaContextType {
  const context = useContext(PayloadSchemaContext);

  if (context === undefined) {
    throw new Error('usePayloadSchema must be used within a PayloadSchemaProvider');
  }

  return context;
}
