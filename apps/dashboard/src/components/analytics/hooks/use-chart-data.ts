import { useMemo } from 'react';

/**
 * Generic hook for transforming chart data with memoization
 */
export function useChartData<TInput, TOutput>(
  data: TInput[] | undefined,
  transformer: (data: TInput[]) => TOutput[]
): TOutput[] | undefined {
  return useMemo(() => {
    if (!data || data.length === 0) return undefined;
    return transformer(data);
  }, [data, transformer]);
}

/**
 * Hook specifically for transforming API data to chart data with common patterns
 */
export function useTransformedChartData<TInput extends { timestamp: string }, TOutput>(
  data: TInput[] | undefined,
  transformer: (item: TInput, index: number, array: TInput[]) => TOutput
): TOutput[] | undefined {
  return useChartData(data, (data) => data.map(transformer));
}
