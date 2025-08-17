import { useCallback, useMemo } from 'react';
import { Line, LineChart, XAxis } from 'recharts';
import { type ActiveSubscribersTrendDataPoint } from '../../../api/activity';

import { ChartConfig, ChartContainer, ChartTooltip, NovuTooltip } from '../../primitives/chart';
import { Skeleton } from '../../primitives/skeleton';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';
import { findMostRecentDateIndex, isCurrentDate } from '../utils/chart-date-utils';
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

function ActiveSubscribersTrendChartSkeleton() {
  return (
    <div className="h-[160px] w-full flex items-end justify-between gap-2 px-2">
      {Array.from({ length: 30 }).map((_, i) => {
        const height = Math.random() * 100 + 20;

        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <Skeleton className="w-full rounded-sm" style={{ height: `${height}px` }} />
          </div>
        );
      })}
    </div>
  );
}

type ActiveSubscribersTrendChartProps = {
  data?: ActiveSubscribersTrendDataPoint[];
  isLoading?: boolean;
  error?: Error | null;
};

export function ActiveSubscribersTrendChart({ data, isLoading, error }: ActiveSubscribersTrendChartProps) {
  const chartData = useMemo(() => {
    return data?.map((dataPoint) => ({
      date: new Date(dataPoint.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      count: dataPoint.count,
      timestamp: dataPoint.timestamp,
      isCurrentDate: isCurrentDate(dataPoint.timestamp),
    }));
  }, [data]);

  const hasDataChecker = useCallback(
    createDateBasedHasDataChecker<ActiveSubscribersChartData>((dataPoint: ActiveSubscribersChartData) => {
      return (dataPoint.count || 0) > 0;
    }),
    []
  );

  const renderChart = useCallback(
    (data: (ActiveSubscribersChartData & { isCurrentDate?: boolean })[], includeTooltip = true) => {
      // Always treat the last data point as the "current/incomplete" date
      const lastIndex = data.length - 1;

      // Transform data to add styling info for the last day
      const transformedData = data.map((item, index) => ({
        ...item,
        // For the last day, create separate data keys for dotted lines
        countSolid: index < lastIndex ? item.count : null,
        // Include previous day for continuity + last day for dotted
        countDotted: index >= lastIndex - 1 ? item.count : null,
        // Keep original values for tooltip
        count: item.count,
      }));

      return (
        <ChartContainer config={chartConfig} className="h-[160px] w-full">
          <LineChart accessibilityLayer data={transformedData}>
            <XAxis
              dataKey="date"
              axisLine={{ stroke: '#e5e7eb', strokeDasharray: '3 3', strokeWidth: 1 }}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#99a0ae', textAnchor: 'middle' }}
              tickFormatter={(value, index) => {
                if (index % 4 === 0) return value;

                return '';
              }}
              domain={['dataMin', 'dataMax']}
            />
            {includeTooltip && (
              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;

                  // Show either solid OR dotted data, but not both
                  const solidEntries = payload.filter((entry) => entry.dataKey === 'countSolid' && entry.value != null);

                  const dottedEntries = payload.filter(
                    (entry) => entry.dataKey === 'countDotted' && entry.value != null
                  );

                  // Prefer solid entries if available, otherwise use dotted
                  const filteredPayload = (solidEntries.length > 0 ? solidEntries : dottedEntries).map((entry) => ({
                    ...entry,
                    // Clean up the name for display
                    name:
                      entry.name?.replace('Solid', '').replace('Dotted', '').replace(' (Current)', '') ||
                      'Active subscribers',
                  }));

                  return <NovuTooltip active={active} payload={filteredPayload} label={label} showTotal={false} />;
                }}
              />
            )}

            {/* Solid line for complete data */}
            <Line
              dataKey="countSolid"
              name="Active subscribers"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              type="monotone"
              connectNulls={false}
            />

            {/* Dotted line for incomplete (last day) data */}
            <Line
              dataKey="countDotted"
              name="Active subscribers (Current)"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              type="monotone"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              connectNulls={false}
            />
          </LineChart>
        </ChartContainer>
      );
    },
    []
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
      loadingSkeleton={<ActiveSubscribersTrendChartSkeleton />}
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
