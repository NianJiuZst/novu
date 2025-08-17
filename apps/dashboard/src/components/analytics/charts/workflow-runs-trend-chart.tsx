import { useCallback, useMemo } from 'react';
import { Line, LineChart, XAxis } from 'recharts';
import { type WorkflowRunsTrendDataPoint } from '../../../api/activity';

import { ChartConfig, ChartContainer, ChartTooltip } from '../../primitives/chart';
import { ChartSkeleton } from '../components/chart-skeleton-factory';
import { UniversalChartTooltip } from '../components/universal-chart-tooltip';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';
import { useTransformedChartData } from '../hooks/use-chart-data';
import { COLOR_PALETTES, createLineProps, createStandardXAxisProps } from '../utils/chart-config-factory';
import { addDateMetadata, createSolidDottedTransformer } from '../utils/chart-data-transformers';
import { createDateBasedHasDataChecker } from '../utils/chart-validation';
import { generateDummyWorkflowRunsData } from './chart-dummy-data';
import { type WorkflowRunsChartData } from './chart-types';
import { ChartWrapper } from './chart-wrapper';

const chartConfig = {
  success: {
    label: 'Completed',
    color: COLOR_PALETTES.workflow.success,
  },
  pending: {
    label: 'Pending',
    color: COLOR_PALETTES.workflow.pending,
  },
  error: {
    label: 'Error',
    color: COLOR_PALETTES.workflow.error,
  },
} satisfies ChartConfig;

type WorkflowRunsTrendChartProps = {
  data?: WorkflowRunsTrendDataPoint[];
  isLoading?: boolean;
  error?: Error | null;
};

export function WorkflowRunsTrendChart({ data, isLoading, error }: WorkflowRunsTrendChartProps) {
  const chartData = useTransformedChartData(data, (dataPoint) => ({
    ...addDateMetadata([dataPoint])[0],
    success: dataPoint.success,
    pending: dataPoint.pending,
    error: dataPoint.error,
  }));

  const transformedData = useMemo(() => {
    if (!chartData) return [];
    const transformer = createSolidDottedTransformer(['success', 'pending', 'error']);
    return transformer(chartData);
  }, [chartData]);

  const hasDataChecker = useCallback(
    createDateBasedHasDataChecker<WorkflowRunsChartData>((dataPoint: WorkflowRunsChartData) => {
      return (dataPoint.success || 0) > 0 || (dataPoint.pending || 0) > 0 || (dataPoint.error || 0) > 0;
    }),
    []
  );

  const renderChart = useCallback(
    (data: WorkflowRunsChartData[], includeTooltip = true) => {
      const workflowKeys = [
        { key: 'success', label: 'Completed', color: COLOR_PALETTES.workflow.success },
        { key: 'pending', label: 'Pending', color: COLOR_PALETTES.workflow.pending },
        { key: 'error', label: 'Error', color: COLOR_PALETTES.workflow.error },
      ];

      return (
        <ChartContainer config={chartConfig} className="h-[160px] w-full">
          <LineChart accessibilityLayer data={transformedData}>
            <XAxis
              {...createStandardXAxisProps(data, {
                tickFormatter: (value, index) => (index % 2 === 0 ? value : ''),
              })}
            />
            {includeTooltip && (
              <ChartTooltip
                cursor={false}
                content={
                  <UniversalChartTooltip
                    dataKeyPatterns={{
                      solid: ['successSolid', 'pendingSolid', 'errorSolid'],
                      dotted: ['successDotted', 'pendingDotted', 'errorDotted'],
                    }}
                    showTotal={false}
                  />
                }
              />
            )}

            {/* Solid lines for complete data */}
            {workflowKeys.map(({ key, label, color }) => (
              <Line key={`${key}-solid`} {...createLineProps(`${key}Solid`, label, color)} />
            ))}

            {/* Dotted lines for incomplete (last day) data */}
            {workflowKeys.map(({ key, label, color }) => (
              <Line
                key={`${key}-dotted`}
                {...createLineProps(`${key}Dotted`, `${label} (Current)`, color, { isDotted: true })}
              />
            ))}
          </LineChart>
        </ChartContainer>
      );
    },
    [transformedData]
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
      loadingSkeleton={<ChartSkeleton type="line" itemCount={35} height={160} />}
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
