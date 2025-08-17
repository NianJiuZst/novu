import { isCurrentDate } from './chart-date-utils';

type TimestampData = { timestamp: string };

/**
 * Creates a date formatter with consistent options
 */
export function createDateFormatter(options?: Intl.DateTimeFormatOptions) {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    ...options,
  };

  return (timestamp: string): string => new Date(timestamp).toLocaleDateString('en-US', defaultOptions);
}

/**
 * Adds common date metadata to chart data
 */
export function addDateMetadata<T extends TimestampData>(data: T[]): (T & { date: string; isCurrentDate: boolean })[] {
  const formatter = createDateFormatter();

  return data.map((item) => ({
    ...item,
    date: formatter(item.timestamp),
    isCurrentDate: isCurrentDate(item.timestamp),
  }));
}

/**
 * Creates a transformer for line charts that need solid/dotted data separation
 * This handles the pattern where the last data point should be dotted (incomplete)
 */
export function createSolidDottedTransformer<T extends Record<string, unknown>>(dataKeys: string[]) {
  return (data: T[]): T[] => {
    const lastIndex = data.length - 1;

    return data.map((item, index) => {
      const transformed: Record<string, unknown> = { ...item };

      for (const key of dataKeys) {
        // For complete data (all days except last)
        transformed[`${key}Solid`] = index < lastIndex ? item[key] : null;
        // For incomplete data (last day + previous for continuity)
        transformed[`${key}Dotted`] = index >= lastIndex - 1 ? item[key] : null;
      }

      return transformed as T;
    });
  };
}

/**
 * Creates a transformer for stacked bar charts that need complete/incomplete data separation
 */
export function createCompleteIncompleteTransformer<T extends Record<string, unknown>>(dataKeys: string[]) {
  return (data: T[]): T[] => {
    const lastIndex = data.length - 1;

    return data.map((item, index) => {
      const transformed: Record<string, unknown> = { ...item };

      for (const key of dataKeys) {
        // For complete data (all days except last)
        transformed[`${key}Complete`] = index < lastIndex ? item[key] : null;
        // For incomplete data (last day only)
        transformed[`${key}Incomplete`] = index === lastIndex ? item[key] : null;
      }

      return transformed as T;
    });
  };
}

/**
 * Transforms volume data with color palette and display names
 */
export function createVolumeDataTransformer<
  TInput extends { count: number },
  TOutput extends TInput & { displayName: string; fill: string },
>(colorPalette: string[], nameFormatter?: (item: TInput, index: number) => string) {
  return (data: TInput[]): TOutput[] => {
    return data.map((item, index) => ({
      ...item,
      displayName: nameFormatter ? nameFormatter(item, index) : String(index),
      fill: colorPalette[index % colorPalette.length],
    })) as TOutput[];
  };
}
