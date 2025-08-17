import { useCallback, useMemo } from 'react';
import { Bar, BarChart, XAxis } from 'recharts';
import { type ChartDataPoint } from '../../../api/activity';

import { ChartConfig, ChartContainer, ChartTooltip } from '../../primitives/chart';
import { ChartSkeleton } from '../components/chart-skeleton-factory';
import { DeliveryChartTooltip } from '../components/delivery-chart-tooltip';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';
import { useTransformedChartData } from '../hooks/use-chart-data';
import { COLOR_PALETTES, createBarProps, createStandardXAxisProps } from '../utils/chart-config-factory';
import { addDateMetadata, createCompleteIncompleteTransformer } from '../utils/chart-data-transformers';
import { createDateBasedHasDataChecker } from '../utils/chart-validation';
import { generateDummyDeliveryData } from './chart-dummy-data';
import { type DeliveryChartData } from './chart-types';
import { ChartWrapper } from './chart-wrapper';

const chartConfig = {
  email: {
    label: 'Email',
    color: COLOR_PALETTES.delivery.email,
  },
  push: {
    label: 'Push',
    color: COLOR_PALETTES.delivery.push,
  },
  sms: {
    label: 'SMS',
    color: COLOR_PALETTES.delivery.sms,
  },
  inApp: {
    label: 'In-App',
    color: COLOR_PALETTES.delivery.inApp,
  },
} satisfies ChartConfig;

type DeliveryTrendsChartProps = {
  data?: ChartDataPoint[];
  isLoading?: boolean;
  error?: Error | null;
};

export function DeliveryTrendsChart({ data, isLoading }: DeliveryTrendsChartProps) {
  const chartData = useTransformedChartData(data, (dataPoint) => ({
    ...addDateMetadata([dataPoint])[0],
    email: dataPoint.email,
    push: dataPoint.push,
    sms: dataPoint.sms,
    inApp: dataPoint.inApp,
    chat: dataPoint.chat,
  }));

  const transformedData = useMemo(() => {
    if (!chartData) return [];
    const transformer = createCompleteIncompleteTransformer(['email', 'push', 'sms', 'inApp', 'chat']);
    return transformer(chartData);
  }, [chartData]);

  const hasDataChecker = useCallback(
    createDateBasedHasDataChecker<DeliveryChartData>((dataPoint: DeliveryChartData) => {
      return (
        (dataPoint.email || 0) > 0 ||
        (dataPoint.push || 0) > 0 ||
        (dataPoint.sms || 0) > 0 ||
        (dataPoint.inApp || 0) > 0 ||
        (dataPoint.chat || 0) > 0
      );
    }),
    []
  );

  const renderChart = useCallback(
    (data: DeliveryChartData[], includeTooltip = true) => {
      const deliveryChannels = [
        {
          key: 'email',
          label: 'Email',
          color: COLOR_PALETTES.delivery.email,
          radius: [3, 3, 6, 6] as [number, number, number, number],
        },
        { key: 'push', label: 'Push', color: COLOR_PALETTES.delivery.push, radius: 3 },
        { key: 'chat', label: 'Chat', color: COLOR_PALETTES.delivery.chat, radius: 3 },
        { key: 'sms', label: 'SMS', color: COLOR_PALETTES.delivery.sms, radius: 3 },
        {
          key: 'inApp',
          label: 'In-App',
          color: COLOR_PALETTES.delivery.inApp,
          radius: [6, 6, 3, 3] as [number, number, number, number],
        },
      ];

      return (
        <ChartContainer config={chartConfig} className="h-[160px] w-full">
          <BarChart accessibilityLayer data={transformedData} barCategoryGap={5}>
            <XAxis {...createStandardXAxisProps(data, { showOnlyFirstLast: true })} />
            {includeTooltip && <ChartTooltip cursor={false} content={<DeliveryChartTooltip />} />}

            {/* Complete data bars (solid) */}
            {deliveryChannels.map(({ key, color, radius }) => (
              <Bar key={`${key}-complete`} {...createBarProps(`${key}Complete`, color, { radius })} />
            ))}

            {/* Incomplete data bars (reduced opacity) */}
            {deliveryChannels.map(({ key, color, radius }) => (
              <Bar key={`${key}-incomplete`} {...createBarProps(`${key}Incomplete`, color, { radius, opacity: 0.5 })} />
            ))}
          </BarChart>
        </ChartContainer>
      );
    },
    [transformedData]
  );

  const renderEmptyState = useCallback(
    (dummyData: DeliveryChartData[]) => {
      return renderChart(dummyData, false);
    },
    [renderChart]
  );

  return (
    <ChartWrapper
      title="Delivery trend"
      data={chartData}
      isLoading={isLoading}
      hasDataChecker={hasDataChecker}
      loadingSkeleton={<ChartSkeleton type="stacked-bar" itemCount={12} height={160} />}
      dummyDataGenerator={generateDummyDeliveryData}
      emptyStateRenderer={renderEmptyState}
      infoTooltip={ANALYTICS_TOOLTIPS.DELIVERY_TREND}
      emptyStateTitle="Not enough data to show"
      emptyStateTooltip={ANALYTICS_TOOLTIPS.INSUFFICIENT_DATE_RANGE}
    >
      {renderChart}
    </ChartWrapper>
  );
}
