import { JSONSchema7 } from 'json-schema';

export type EditableJsonViewerProps = {
  value: any;
  onChange: (updatedData: any) => void;
  className?: string;
  schema?: JSONSchema7;
  isReadOnly?: boolean;
};
