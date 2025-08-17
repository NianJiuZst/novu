import { useCallback, useMemo } from 'react';
import { Line, LineChart, XAxis } from 'recharts';
import { type ActiveSubscribersTrendDataPoint } from '../../../api/activity';

import { ChartConfig, ChartContainer, ChartTooltip } from '../../primitives/chart';
import { ChartSkeleton } from '../components/chart-skeleton-factory';
import { UniversalChartTooltip } from '../components/universal-chart-tooltip';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';
import { useTransformedChartData } from '../hooks/use-chart-data';
import { createLineProps, createStandardXAxisProps } from '../utils/chart-config-factory';
import { addDateMetadata, createSolidDottedTransformer } from '../utils/chart-data-transformers';
import { createDateBasedHasDataChecker } from '../utils/chart-validation';
import { generateDummyActiveSubscribersData } from './chart-dummy-data';
import { type ActiveSubscribersChartData } from './chart-types';
import { ChartWrapper } from './chart-wrapper';

const chartConfig = {
  count: {
    label: 'Active subscribers',
    color: '#6366f1',
  },
} satisfies ChartConfig;

type ActiveSubscribersTrendChartProps = {
  data?: ActiveSubscribersTrendDataPoint[];
  isLoading?: boolean;
  error?: Error | null;
};

export function ActiveSubscribersTrendChart({ data, isLoading, error }: ActiveSubscribersTrendChartProps) {
  const chartData = useTransformedChartData(data, (dataPoint) => ({
    ...addDateMetadata([dataPoint])[0],
    count: dataPoint.count,
  }));

  const transformedData = useMemo(() => {
    if (!chartData) return [];
    const transformer = createSolidDottedTransformer(['count']);
    return transformer(chartData);
  }, [chartData]);

  const hasDataChecker = useCallback(
    createDateBasedHasDataChecker<ActiveSubscribersChartData>((dataPoint: ActiveSubscribersChartData) => {
      return (dataPoint.count || 0) > 0;
    }),
    []
  );

  const renderChart = useCallback(
    (data: ActiveSubscribersChartData[], includeTooltip = true) => {
      return (
        <ChartContainer config={chartConfig} className="h-[160px] w-full">
          <LineChart accessibilityLayer data={transformedData}>
            <XAxis
              {...createStandardXAxisProps(data, {
                tickFormatter: (value, index) => (index % 4 === 0 ? value : ''),
              })}
            />
            {includeTooltip && (
              <ChartTooltip
                cursor={false}
                content={
                  <UniversalChartTooltip
                    dataKeyPatterns={{
                      solid: ['countSolid'],
                      dotted: ['countDotted'],
                    }}
                    showTotal={false}
                  />
                }
              />
            )}

            <Line {...createLineProps('countSolid', 'Active subscribers', '#6366f1')} />
            <Line {...createLineProps('countDotted', 'Active subscribers (Current)', '#6366f1', { isDotted: true })} />
          </LineChart>
        </ChartContainer>
      );
    },
    [transformedData]
  );

  const renderEmptyState = useCallback(
    (dummyData: ActiveSubscribersChartData[]) => {
      return renderChart(dummyData, false);
    },
    [renderChart]
  );

  return (
    <ChartWrapper
      title="Active subscribers"
      data={chartData}
      isLoading={isLoading}
      error={error}
      hasDataChecker={hasDataChecker}
      loadingSkeleton={<ChartSkeleton type="line" itemCount={30} height={160} />}
      dummyDataGenerator={generateDummyActiveSubscribersData}
      emptyStateRenderer={renderEmptyState}
      infoTooltip={ANALYTICS_TOOLTIPS.ACTIVE_SUBSCRIBERS_TREND}
      emptyStateTitle="Not enough data to show"
      emptyStateTooltip={ANALYTICS_TOOLTIPS.INSUFFICIENT_DATE_RANGE}
    >
      {renderChart}
    </ChartWrapper>
  );
}
