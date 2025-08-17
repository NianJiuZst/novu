import { useCallback, useMemo } from 'react';
import { Line, LineChart, XAxis } from 'recharts';
import { type InteractionTrendDataPoint } from '../../../api/activity';

import { ChartConfig, ChartContainer, ChartTooltip, NovuTooltip } from '../../primitives/chart';
import { Skeleton } from '../../primitives/skeleton';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';
import { findMostRecentDateIndex, isCurrentDate } from '../utils/chart-date-utils';
import { createDateBasedHasDataChecker } from '../utils/chart-validation';
import { generateDummyInteractionData } from './chart-dummy-data';
import { type InteractionChartData } from './chart-types';
import { ChartWrapper } from './chart-wrapper';

const chartConfig = {
  messageSeen: {
    label: 'Seen',
    color: '#60a5fa',
  },
  messageRead: {
    label: 'Read',
    color: '#34d399',
  },
  messageSnoozed: {
    label: 'Snoozed',
    color: '#a78bfa',
  },
  messageArchived: {
    label: 'Archived',
    color: '#f97316',
  },
} satisfies ChartConfig;

function InteractionTrendChartSkeleton() {
  return (
    <div className="h-[160px] w-full flex items-end justify-between gap-2 px-2">
      {Array.from({ length: 20 }).map((_, i) => {
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

type InteractionTrendChartProps = {
  data?: InteractionTrendDataPoint[];
  isLoading?: boolean;
  error?: Error | null;
};

export function InteractionTrendChart({ data, isLoading, error }: InteractionTrendChartProps) {
  const chartData = useMemo(() => {
    return data?.map((dataPoint) => ({
      date: new Date(dataPoint.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      messageSeen: dataPoint.messageSeen,
      messageRead: dataPoint.messageRead,
      messageSnoozed: dataPoint.messageSnoozed,
      messageArchived: dataPoint.messageArchived,
      timestamp: dataPoint.timestamp,
      isCurrentDate: isCurrentDate(dataPoint.timestamp),
    }));
  }, [data]);

  const hasDataChecker = useCallback(
    createDateBasedHasDataChecker<InteractionChartData>((dataPoint: InteractionChartData) => {
      return (
        (dataPoint.messageSeen || 0) > 0 ||
        (dataPoint.messageRead || 0) > 0 ||
        (dataPoint.messageSnoozed || 0) > 0 ||
        (dataPoint.messageArchived || 0) > 0
      );
    }),
    []
  );

  const renderChart = useCallback(
    (data: (InteractionChartData & { isCurrentDate?: boolean })[], includeTooltip = true) => {
      const firstDate = data[1]?.date || '';
      const lastDate = data[data.length - 1]?.date || '';

      // Always treat the last data point as the "current/incomplete" date
      const lastIndex = data.length - 1;

      // Transform data to add styling info for the last day
      const transformedData = data.map((item, index) => ({
        ...item,
        // For the last day, create separate data keys for dotted lines
        messageSeenSolid: index < lastIndex ? item.messageSeen : null,
        messageReadSolid: index < lastIndex ? item.messageRead : null,
        messageSnoozedSolid: index < lastIndex ? item.messageSnoozed : null,
        messageArchivedSolid: index < lastIndex ? item.messageArchived : null,
        // Include previous day for continuity + last day for dotted
        messageSeenDotted: index >= lastIndex - 1 ? item.messageSeen : null,
        messageReadDotted: index >= lastIndex - 1 ? item.messageRead : null,
        messageSnoozedDotted: index >= lastIndex - 1 ? item.messageSnoozed : null,
        messageArchivedDotted: index >= lastIndex - 1 ? item.messageArchived : null,
        // Keep original values for tooltip
        messageSeen: item.messageSeen,
        messageRead: item.messageRead,
        messageSnoozed: item.messageSnoozed,
        messageArchived: item.messageArchived,
      }));

      return (
        <ChartContainer config={chartConfig} className="h-[160px] w-full">
          <LineChart accessibilityLayer data={transformedData}>
            <XAxis
              dataKey="date"
              axisLine={{ stroke: '#e5e7eb', strokeDasharray: '3 3', strokeWidth: 1 }}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#99a0ae', textAnchor: 'middle' }}
              ticks={[firstDate, lastDate]}
              domain={['dataMin', 'dataMax']}
            />
            {includeTooltip && (
              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;

                  // Show either solid OR dotted data, but not both
                  const solidEntries = payload.filter(
                    (entry) =>
                      ['messageSeenSolid', 'messageReadSolid', 'messageSnoozedSolid', 'messageArchivedSolid'].includes(
                        entry.dataKey as string
                      ) && entry.value != null
                  );

                  const dottedEntries = payload.filter(
                    (entry) =>
                      [
                        'messageSeenDotted',
                        'messageReadDotted',
                        'messageSnoozedDotted',
                        'messageArchivedDotted',
                      ].includes(entry.dataKey as string) && entry.value != null
                  );

                  // Prefer solid entries if available, otherwise use dotted
                  const filteredPayload = (solidEntries.length > 0 ? solidEntries : dottedEntries).map((entry) => ({
                    ...entry,
                    // Clean up the name for display
                    name:
                      entry.name?.replace('Solid', '').replace('Dotted', '').replace(' (Current)', '') ||
                      entry.dataKey?.toString().replace('Solid', '').replace('Dotted', ''),
                  }));

                  return <NovuTooltip active={active} payload={filteredPayload} label={label} showTotal={false} />;
                }}
              />
            )}

            {/* Solid lines for complete data */}
            <Line
              dataKey="messageSeenSolid"
              name="Seen"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
              type="monotone"
              connectNulls={false}
            />
            <Line
              dataKey="messageReadSolid"
              name="Read"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              type="monotone"
              connectNulls={false}
            />
            <Line
              dataKey="messageSnoozedSolid"
              name="Snoozed"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
              type="monotone"
              connectNulls={false}
            />
            <Line
              dataKey="messageArchivedSolid"
              name="Archived"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              type="monotone"
              connectNulls={false}
            />

            {/* Dotted lines for incomplete (last day) data */}
            <Line
              dataKey="messageSeenDotted"
              name="Seen (Current)"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
              type="monotone"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              connectNulls={false}
            />
            <Line
              dataKey="messageReadDotted"
              name="Read (Current)"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              type="monotone"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              connectNulls={false}
            />
            <Line
              dataKey="messageSnoozedDotted"
              name="Snoozed (Current)"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
              type="monotone"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              connectNulls={false}
            />
            <Line
              dataKey="messageArchivedDotted"
              name="Archived (Current)"
              stroke="#f97316"
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
    (dummyData: InteractionChartData[]) => {
      return renderChart(dummyData, false);
    },
    [renderChart]
  );

  return (
    <ChartWrapper
      title="Interaction trend"
      data={chartData}
      isLoading={isLoading}
      error={error}
      hasDataChecker={hasDataChecker}
      loadingSkeleton={<InteractionTrendChartSkeleton />}
      dummyDataGenerator={generateDummyInteractionData}
      emptyStateRenderer={renderEmptyState}
      infoTooltip={ANALYTICS_TOOLTIPS.INTERACTION_TREND}
      emptyStateTitle="Not enough data to show"
      emptyStateTooltip={ANALYTICS_TOOLTIPS.INSUFFICIENT_DATE_RANGE}
    >
      {renderChart}
    </ChartWrapper>
  );
}
