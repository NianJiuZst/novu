export interface PayloadSchemaContextType {
  pendingVariables: Set<string>;
  addPendingVariable: (variableName: string) => void;
  removePendingVariable: (variableName: string) => void;
  isPendingVariable: (variableName: string) => boolean;
  version: number; // Used to trigger re-renders in consumers
}
