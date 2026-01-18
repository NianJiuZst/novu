import { QueryFilter, Types } from 'mongoose';

export type ChangePropsValueType<T, K extends keyof T, V = Types.ObjectId> = Omit<T, K> & {
  [P in K]: V;
};

/**
 * A more permissive query filter type for internal use.
 * Mongoose 9's QueryFilter has stricter typing, this provides backward compatibility.
 * @see https://mongoosejs.com/docs/migrating_to_9.html#queryfilter-properties-no-longer-resolve-to-any
 */
export type PermissiveQueryFilter<T> = QueryFilter<T> | Record<string, unknown>;
