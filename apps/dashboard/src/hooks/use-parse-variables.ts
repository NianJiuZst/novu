import { parseStepVariables } from '@/utils/parseStepVariables';
import { type JSONSchemaDefinition } from '@novu/shared';
import { useMemo } from 'react';
import { usePayloadSchema } from '@/context/payload-schema';

export function useParseVariables(schema?: JSONSchemaDefinition, digestStepId?: string, baseNamespace?: string) {
  const { pendingVariables, version: payloadSchemaVersion } = usePayloadSchema();

  const parsedVariables = useMemo(() => {
    const result = schema
      ? parseStepVariables(schema, { digestStepId, pendingVariablesSet: pendingVariables, baseNamespace })
      : {
          variables: [],
          namespaces: [],
          primitives: [],
          arrays: [],
          isAllowedVariable: () => false,
          isVariableInSchema: () => false,
        };
    return result;
  }, [schema, digestStepId, pendingVariables, payloadSchemaVersion, baseNamespace]);

  return parsedVariables;
}
