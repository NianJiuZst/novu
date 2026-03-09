import { Transform } from 'class-transformer';

// use this transformer in combination with @IsBoolean validator.

export const TransformToBoolean = () =>
  Transform(({ value }) => {
    if (value === '' || value === null) return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;

    return value;
  });
