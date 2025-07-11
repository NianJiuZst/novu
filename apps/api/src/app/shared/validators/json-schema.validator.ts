import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { registerDecorator, type ValidationArguments, type ValidationOptions } from 'class-validator';

export function IsValidJsonSchema(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidJsonSchema',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value || typeof value !== 'object') {
            return false;
          }

          try {
            const ajv = new Ajv({ strict: false });
            addFormats(ajv);

            ajv.compile(value);

            return true;
          } catch (error) {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid JSON schema`;
        },
      },
    });
  };
}
