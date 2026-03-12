/**
 * Array-based select: ['name', 'email']
 * Only accepts valid keys of the entity.
 */
export type SelectFieldsArray<T> = readonly (keyof T & string)[];

/**
 * Object-based select: { name: 1, email: 1 } or { _id: 0, name: 1 }
 *
 * MongoDB projection rules enforced at the type level:
 * - All regular fields can only be included (value: 1)
 * - `_id` is the sole exception -- it can be excluded (value: 0) alongside inclusion fields
 * - Full exclusion projections (e.g. { name: 0 }) are intentionally disallowed;
 *   V2 requires explicit field selection
 */
export type SelectFieldsObject<T> = { readonly _id?: 0 | 1 } & {
  readonly [K in Exclude<keyof T & string, '_id'>]?: 1;
};

/**
 * Union of all accepted select syntaxes. Use `'*'` to select all fields and
 * get a fully-typed `T` in the return value instead of a `Pick<T, Keys>`.
 */
export type SelectInput<T> = SelectFieldsArray<T> | SelectFieldsObject<T> | '*';

/**
 * Extracts the keys with value `1` from an object-based select,
 * filtered to keys that actually exist on T.
 */
export type IncludedKeys<S, T> = {
  [K in keyof S]: S[K] extends 1 ? (K extends keyof T ? K : never) : never;
}[keyof S];

/**
 * Infers the projected result type from a select input, mirroring MongoDB behavior:
 *
 * - Array syntax:           ['name', 'email']           → Pick<T, 'name' | 'email' | '_id'>
 * - Object, no _id:0:       { name: 1, email: 1 }       → Pick<T, 'name' | 'email' | '_id'>
 * - Object, with _id:0:     { _id: 0, name: 1, email: 1 } → Pick<T, 'name' | 'email'>
 *
 * MongoDB always returns `_id` unless explicitly excluded via `_id: 0`.
 */
export type InferProjection<T, S extends SelectInput<T>> = S extends readonly (infer K)[]
  ? K extends keyof T
    ? Pick<T, (K & keyof T) | ('_id' extends keyof T ? '_id' : never)>
    : never
  : S extends { _id: 0 }
    ? Pick<T, Exclude<IncludedKeys<S, T>, '_id'>>
    : Pick<T, IncludedKeys<S, T> | ('_id' extends keyof T ? '_id' : never)>;

/**
 * Normalizes both select syntaxes into a Mongoose-compatible projection object.
 * Preserves `_id: 0` when present in object syntax.
 */
export function convertSelectToProjection<T>(select: SelectInput<T>): Record<string, 0 | 1> | undefined {
  if (select === '*') return undefined;

  if (Array.isArray(select)) {
    return Object.fromEntries((select as string[]).map((key) => [key, 1]));
  }

  return { ...(select as Record<string, 0 | 1>) };
}

/**
 * Recursively converts Mongoose ObjectId and Date instances to their primitive
 * string representations. This replaces the JSON.parse(JSON.stringify()) round-trip
 * used in BaseRepository, which is the mechanism that converts ObjectId to string
 * (since entity classes use plain `string` for all ID fields and have no @Transform decorators).
 *
 * Compared to a full JSON cycle this is faster for projected (small) documents
 * because it skips serializing/deserializing primitive values.
 */
export function convertObjectIds(obj: unknown): unknown {
  if (obj == null) return obj;

  if (typeof obj === 'object') {
    if (isObjectId(obj)) return (obj as { toHexString(): string }).toHexString();
    if (obj instanceof Date) return obj.toISOString();

    if (Array.isArray(obj)) return obj.map(convertObjectIds);

    if (obj.constructor === Object) {
      const result: Record<string, unknown> = {};

      for (const key of Object.keys(obj)) {
        result[key] = convertObjectIds((obj as Record<string, unknown>)[key]);
      }

      return result;
    }
  }

  return obj;
}

function isObjectId(value: object): boolean {
  return '_bsontype' in value && (value as { _bsontype: unknown })._bsontype === 'ObjectId';
}
