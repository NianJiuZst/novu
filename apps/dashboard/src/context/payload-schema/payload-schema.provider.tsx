import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { PayloadSchemaContext } from './payload-schema.context';
import type { PayloadSchemaContextType } from './payload-schema.types';

interface PayloadSchemaProviderProps {
  children: ReactNode;
}

export function PayloadSchemaProvider({ children }: PayloadSchemaProviderProps) {
  const [pendingVariables, setPendingVariables] = useState<Set<string>>(new Set());
  const [version, setVersion] = useState(0);

  const addPendingVariable = useCallback((variableName: string) => {
    setPendingVariables((prev) => {
      const newSet = new Set(prev);
      newSet.add(variableName);
      return newSet;
    });
    setVersion((v) => v + 1);
  }, []);

  const removePendingVariable = useCallback((variableName: string) => {
    setPendingVariables((prev) => {
      const newSet = new Set(prev);
      newSet.delete(variableName);
      return newSet;
    });
    setVersion((v) => v + 1);
  }, []);

  const isPendingVariable = useCallback(
    (variableName: string) => pendingVariables.has(variableName),
    [pendingVariables]
  );

  const contextValue = useMemo<PayloadSchemaContextType>(
    () => ({
      pendingVariables,
      addPendingVariable,
      removePendingVariable,
      isPendingVariable,
      version,
    }),
    [pendingVariables, addPendingVariable, removePendingVariable, isPendingVariable, version]
  );

  return <PayloadSchemaContext.Provider value={contextValue}>{children}</PayloadSchemaContext.Provider>;
}
