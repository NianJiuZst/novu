import { StepTypeEnum } from '@novu/shared';
import { useCallback, useMemo } from 'react';
import { Bar, BarChart, XAxis } from 'recharts';
import { type ChartDataPoint } from '../../../api/activity';
import { STEP_TYPE_TO_ICON } from '../../icons/utils';

import { ChartConfig, ChartContainer, ChartTooltip, NovuTooltip } from '../../primitives/chart';
import { Skeleton } from '../../primitives/skeleton';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';
import { createDateBasedHasDataChecker } from '../utils/chart-validation';
import { generateDummyDeliveryData } from './chart-dummy-data';
import { type DeliveryChartData } from './chart-types';
import { ChartWrapper } from './chart-wrapper';

const chartConfig = {
  email: {
    label: 'Email',
    color: '#8b5cf6',
  },
  push: {
    label: 'Push',
    color: '#06b6d4',
  },
  sms: {
    label: 'SMS',
    color: '#facc15',
  },
  inApp: {
    label: 'In-App',
    color: '#f97316',
  },
} satisfies ChartConfig;

type DeliveryTooltipProps = {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number;
    color?: string;
    payload?: {
      email?: number;
      push?: number;
      sms?: number;
      inApp?: number;
      chat?: number;
      date?: string;
      timestamp?: string;
    };
  }>;
  label?: string;
};

function DeliveryTooltip(props: DeliveryTooltipProps) {
  const data = props.payload?.[0]?.payload;

  // Get values from either complete or incomplete data (whichever is available)
  const getChannelValue = (channel: string) => {
    const completeValue = data?.[`${channel}Complete` as keyof typeof data] as number;
    const incompleteValue = data?.[`${channel}Incomplete` as keyof typeof data] as number;
    const originalValue = data?.[channel as keyof typeof data] as number;

    return completeValue || incompleteValue || originalValue || 0;
  };

  const channels = [
    {
      key: 'email',
      label: 'Email',
      value: getChannelValue('email'),
      color: '#8b5cf6',
      icon: STEP_TYPE_TO_ICON[StepTypeEnum.EMAIL],
    },
    {
      key: 'push',
      label: 'Push',
      value: getChannelValue('push'),
      color: '#06b6d4',
      icon: STEP_TYPE_TO_ICON[StepTypeEnum.PUSH],
    },
    {
      key: 'chat',
      label: 'Chat',
      value: getChannelValue('chat'),
      color: '#10b981',
      icon: STEP_TYPE_TO_ICON[StepTypeEnum.CHAT],
    },
    {
      key: 'sms',
      label: 'SMS',
      value: getChannelValue('sms'),
      color: '#facc15',
      icon: STEP_TYPE_TO_ICON[StepTypeEnum.SMS],
    },
    {
      key: 'inApp',
      label: 'In-app (Inbox)',
      value: getChannelValue('inApp'),
      color: '#f97316',
      icon: STEP_TYPE_TO_ICON[StepTypeEnum.IN_APP],
    },
  ];

  return <NovuTooltip active={props.active} label={props.label} rows={channels} showTotal={true} />;
}

function DeliveryTrendsChartSkeleton() {
  return (
    <div className="h-[160px] w-full flex items-end justify-between gap-1 px-2">
      {Array.from({ length: 12 }).map((_, i) => {
        const totalHeight = Math.random() * 80 + 40;
        const segments = [
          { height: totalHeight * 0.4 },
          { height: totalHeight * 0.25 },
          { height: totalHeight * 0.2 },
          { height: totalHeight * 0.15 },
        ];

        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full max-w-[20px] flex flex-col rounded-sm overflow-hidden border-2 border-white">
              {segments.map((segment, segmentIndex) => (
                <Skeleton key={segmentIndex} className="w-full rounded-sm" style={{ height: `${segment.height}px` }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type DeliveryTrendsChartProps = {
  data?: ChartDataPoint[];
  isLoading?: boolean;
  error?: Error | null;
};

export function DeliveryTrendsChart({ data, isLoading }: DeliveryTrendsChartProps) {
  const chartData = useMemo(() => {
    return data?.map((dataPoint) => ({
      date: new Date(dataPoint.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      email: dataPoint.email,
      push: dataPoint.push,
      sms: dataPoint.sms,
      inApp: dataPoint.inApp,
      chat: dataPoint.chat,
      timestamp: dataPoint.timestamp,
    }));
  }, [data]);

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

  const renderChart = useCallback((data: DeliveryChartData[], includeTooltip = true) => {
    const firstDate = data[1]?.date || '';
    const lastDate = data[data.length - 1]?.date || '';
    const lastIndex = data.length - 1;

    // Transform data to add styling info for the last day (incomplete data)
    const transformedData = data.map((item, index) => ({
      ...item,
      // For complete data (all days except last)
      emailComplete: index < lastIndex ? item.email : null,
      pushComplete: index < lastIndex ? item.push : null,
      smsComplete: index < lastIndex ? item.sms : null,
      inAppComplete: index < lastIndex ? item.inApp : null,
      chatComplete: index < lastIndex ? item.chat : null,
      // For incomplete data (last day only)
      emailIncomplete: index === lastIndex ? item.email : null,
      pushIncomplete: index === lastIndex ? item.push : null,
      smsIncomplete: index === lastIndex ? item.sms : null,
      inAppIncomplete: index === lastIndex ? item.inApp : null,
      chatIncomplete: index === lastIndex ? item.chat : null,
    }));

    return (
      <ChartContainer config={chartConfig} className="h-[160px] w-full">
        <BarChart accessibilityLayer data={transformedData} barCategoryGap={5}>
          <XAxis
            dataKey="date"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fontSize: 10, fill: '#99a0ae' }}
            ticks={[firstDate, lastDate]}
          />
          {includeTooltip && <ChartTooltip cursor={false} content={<DeliveryTooltip />} />}

          {/* Complete data bars (solid) */}
          <Bar
            dataKey="emailComplete"
            stackId="a"
            barSize={20}
            fill="#8b5cf6"
            radius={[3, 3, 6, 6]}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Bar
            dataKey="pushComplete"
            stackId="a"
            barSize={20}
            fill="#06b6d4"
            radius={3}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Bar
            dataKey="chatComplete"
            stackId="a"
            barSize={20}
            fill="#10b981"
            radius={3}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Bar
            dataKey="smsComplete"
            stackId="a"
            barSize={20}
            fill="#facc15"
            radius={3}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Bar
            dataKey="inAppComplete"
            stackId="a"
            barSize={20}
            fill="#f97316"
            radius={[6, 6, 3, 3]}
            stroke="#ffffff"
            strokeWidth={2}
          />

          {/* Incomplete data bars (reduced opacity) */}
          <Bar
            dataKey="emailIncomplete"
            stackId="a"
            barSize={20}
            fill="#8b5cf6"
            fillOpacity={0.5}
            radius={[3, 3, 6, 6]}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Bar
            dataKey="pushIncomplete"
            stackId="a"
            barSize={20}
            fill="#06b6d4"
            fillOpacity={0.5}
            radius={3}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Bar
            dataKey="chatIncomplete"
            stackId="a"
            barSize={20}
            fill="#10b981"
            fillOpacity={0.5}
            radius={3}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Bar
            dataKey="smsIncomplete"
            stackId="a"
            barSize={20}
            fill="#facc15"
            fillOpacity={0.5}
            radius={3}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Bar
            dataKey="inAppIncomplete"
            stackId="a"
            barSize={20}
            fill="#f97316"
            fillOpacity={0.5}
            radius={[6, 6, 3, 3]}
            stroke="#ffffff"
            strokeWidth={2}
          />
        </BarChart>
      </ChartContainer>
    );
  }, []);

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
      loadingSkeleton={<DeliveryTrendsChartSkeleton />}
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
