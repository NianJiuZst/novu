import { useCallback, useMemo } from 'react';
import { Line, LineChart, XAxis } from 'recharts';
import { type WorkflowRunsTrendDataPoint } from '../../../api/activity';

import { ChartConfig, ChartContainer, ChartTooltip, NovuTooltip } from '../../primitives/chart';
import { Skeleton } from '../../primitives/skeleton';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';
import { findMostRecentDateIndex, isCurrentDate } from '../utils/chart-date-utils';
import { createDateBasedHasDataChecker } from '../utils/chart-validation';
import { generateDummyWorkflowRunsData } from './chart-dummy-data';
import { type WorkflowRunsChartData } from './chart-types';
import { ChartWrapper } from './chart-wrapper';

const chartConfig = {
  success: {
    label: 'Success',
    color: '#34d399',
  },
  pending: {
    label: 'Pending',
    color: '#facc15',
  },
  error: {
    label: 'Error',
    color: '#ef4444',
  },
} satisfies ChartConfig;

function WorkflowRunsTrendChartSkeleton() {
  return (
    <div className="h-[160px] w-full relative px-4">
      <div className="absolute inset-0 flex items-end justify-between px-2">
        {Array.from({ length: 35 }).map((_, i) => {
          const baseHeight = 40;
          const successHeight = baseHeight + Math.sin(i * 0.3) * 30 + Math.random() * 20;

          return (
            <div key={i} className="flex flex-col items-center flex-1 relative">
              <div className="relative w-full flex justify-center">
                <Skeleton
                  className="rounded-sm"
                  style={{
                    height: `${Math.max(successHeight, 20)}px`,
                    width: '15px',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-6 left-4 right-4 h-px">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}

type WorkflowRunsTrendChartProps = {
  data?: WorkflowRunsTrendDataPoint[];
  isLoading?: boolean;
  error?: Error | null;
};

export function WorkflowRunsTrendChart({ data, isLoading, error }: WorkflowRunsTrendChartProps) {
  const chartData = useMemo(() => {
    return data?.map((dataPoint) => ({
      date: new Date(dataPoint.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      success: dataPoint.success,
      pending: dataPoint.pending,
      error: dataPoint.error,
      timestamp: dataPoint.timestamp,
      isCurrentDate: isCurrentDate(dataPoint.timestamp),
    }));
  }, [data]);

  const hasDataChecker = useCallback(
    createDateBasedHasDataChecker<WorkflowRunsChartData>((dataPoint: WorkflowRunsChartData) => {
      return (dataPoint.success || 0) > 0 || (dataPoint.pending || 0) > 0 || (dataPoint.error || 0) > 0;
    }),
    []
  );

  const renderChart = useCallback(
    (data: (WorkflowRunsChartData & { isCurrentDate?: boolean })[], includeTooltip = true) => {
      // Always treat the last data point as the "current/incomplete" date
      const lastIndex = data.length - 1;

      // Transform data to add styling info for the last day
      const transformedData = data.map((item, index) => ({
        ...item,
        // For the last day, create separate data keys for dotted lines
        successSolid: index < lastIndex ? item.success : null,
        pendingSolid: index < lastIndex ? item.pending : null,
        errorSolid: index < lastIndex ? item.error : null,
        // Include previous day for continuity + last day for dotted
        successDotted: index >= lastIndex - 1 ? item.success : null,
        pendingDotted: index >= lastIndex - 1 ? item.pending : null,
        errorDotted: index >= lastIndex - 1 ? item.error : null,
        // Keep original values for tooltip (will be used by custom tooltip)
        success: item.success,
        pending: item.pending,
        error: item.error,
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
                if (index % 2 === 0) return value;

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
                  const solidEntries = payload.filter(
                    (entry) =>
                      ['successSolid', 'pendingSolid', 'errorSolid'].includes(entry.dataKey as string) &&
                      entry.value != null
                  );

                  const dottedEntries = payload.filter(
                    (entry) =>
                      ['successDotted', 'pendingDotted', 'errorDotted'].includes(entry.dataKey as string) &&
                      entry.value != null
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
              dataKey="successSolid"
              name="Completed"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              type="monotone"
              connectNulls={false}
            />
            <Line
              dataKey="pendingSolid"
              name="Pending"
              stroke="#facc15"
              strokeWidth={2}
              dot={false}
              type="monotone"
              connectNulls={false}
            />
            <Line
              dataKey="errorSolid"
              name="Error"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              type="monotone"
              connectNulls={false}
            />

            {/* Dotted lines for incomplete (last day) data */}
            <Line
              dataKey="successDotted"
              name="Completed (Current)"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              type="monotone"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              connectNulls={false}
            />
            <Line
              dataKey="pendingDotted"
              name="Pending (Current)"
              stroke="#facc15"
              strokeWidth={2}
              dot={false}
              type="monotone"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              connectNulls={false}
            />
            <Line
              dataKey="errorDotted"
              name="Error (Current)"
              stroke="#ef4444"
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
    (dummyData: WorkflowRunsChartData[]) => {
      return renderChart(dummyData, false);
    },
    [renderChart]
  );

  return (
    <ChartWrapper
      title="Workflow runs"
      data={chartData}
      isLoading={isLoading}
      error={error}
      hasDataChecker={hasDataChecker}
      loadingSkeleton={<WorkflowRunsTrendChartSkeleton />}
      dummyDataGenerator={generateDummyWorkflowRunsData}
      emptyStateRenderer={renderEmptyState}
      infoTooltip={ANALYTICS_TOOLTIPS.WORKFLOW_RUNS_TREND}
      emptyStateTitle="Not enough data to show"
      emptyStateTooltip={ANALYTICS_TOOLTIPS.INSUFFICIENT_DATE_RANGE}
    >
      {renderChart}
    </ChartWrapper>
  );
}
