import type { JSONSchemaDto } from '../../shared/dtos/json-schema.dto';
import type { UiSchema } from './ui-schema.dto';

export class ControlSchemasDto {
  schema: JSONSchemaDto;
  uiSchema?: UiSchema;
}
