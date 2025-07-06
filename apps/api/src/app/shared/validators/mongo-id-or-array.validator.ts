import { ValidateBy } from 'class-validator';
import { Types } from 'mongoose';

// Custom validator for MongoDB ObjectId that can be string or string[]
export function IsMongoIdOrArray() {
  return ValidateBy({
    name: 'isMongoIdOrArray',
    validator: {
      validate(value: any): boolean {
        if (typeof value === 'string') {
          return Types.ObjectId.isValid(value);
        }
        if (Array.isArray(value)) {
          return value.every(id => typeof id === 'string' && Types.ObjectId.isValid(id));
        }
        return false;
      },
      defaultMessage(): string {
        return 'Field must be a valid MongoDB ObjectId or an array of valid MongoDB ObjectIds';
      },
    },
  });
}
