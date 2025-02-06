import { JSONSchemaDto } from '@novu/shared';
import { add } from 'date-fns';

function determineSchemaType(value: unknown): JSONSchemaDto {
  if (value === null) {
    return { type: 'null' };
  }

  if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length > 0 ? determineSchemaType(value[0]) : { type: 'null' },
    };
  }

  switch (typeof value) {
    case 'string':
      return { type: 'string', default: value };
    case 'number':
      return { type: 'number', default: value };
    case 'boolean':
      return { type: 'boolean', default: value };
    case 'object':
      return {
        type: 'object',
        properties: Object.entries(value).reduce(
          (acc, [key, val]) => {
            acc[key] = determineSchemaType(val);

            return acc;
          },
          {} as { [key: string]: JSONSchemaDto }
        ),
        required: Object.keys(value),
      };

    default:
      return { type: 'null' };
  }
}

type BuildVariablesSchemaOptions = Partial<{
  additionalProperties: boolean;
  required: string[];
}>;

export function buildVariablesSchema(
  object: unknown,
  options: BuildVariablesSchemaOptions = {
    additionalProperties: true,
    required: [],
  }
) {
  const schema: JSONSchemaDto = {
    ...options,
    type: 'object',
    properties: {},
  };

  if (object) {
    for (const [key, value] of Object.entries(object)) {
      if (schema.properties) {
        schema.properties[key] = determineSchemaType(value);
      }
      if (schema.required) {
        schema.required.push(key);
      }
    }
  }

  return schema;
}
