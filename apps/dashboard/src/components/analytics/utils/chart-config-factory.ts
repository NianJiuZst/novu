import { ChartConfig } from '../../primitives/chart';

/**
 * Standard X-axis props for date-based charts
 */
export function createStandardXAxisProps(
  data: Array<{ date: string }>,
  options?: {
    showOnlyFirstLast?: boolean;
    tickFormatter?: (value: string, index: number) => string;
  }
) {
  const { showOnlyFirstLast = false, tickFormatter } = options || {};

  const baseProps = {
    dataKey: 'date' as const,
    axisLine: { stroke: '#e5e7eb', strokeDasharray: '3 3', strokeWidth: 1 },
    tickLine: false,
    tick: { fontSize: 10, fill: '#99a0ae', textAnchor: 'middle' as const },
    domain: ['dataMin' as const, 'dataMax' as const],
  };

  if (showOnlyFirstLast && data.length > 0) {
    return {
      ...baseProps,
      ticks: [data[1]?.date || data[0]?.date, data[data.length - 1]?.date],
    };
  }

  if (tickFormatter) {
    return {
      ...baseProps,
      tickFormatter,
    };
  }

  return baseProps;
}

/**
 * Creates standard line props for chart lines
 */
export function createLineProps(
  dataKey: string,
  name: string,
  color: string,
  options?: {
    isDotted?: boolean;
    opacity?: number;
  }
) {
  const { isDotted = false, opacity = 1 } = options || {};

  return {
    dataKey,
    name,
    stroke: color,
    strokeWidth: 2,
    dot: false,
    type: 'monotone' as const,
    connectNulls: false,
    ...(isDotted && {
      strokeDasharray: '4 4',
      strokeOpacity: opacity * 0.7,
    }),
  };
}

/**
 * Creates standard bar props for chart bars
 */
export function createBarProps(
  dataKey: string,
  color: string,
  options?: {
    stackId?: string;
    barSize?: number;
    radius?: number | [number, number, number, number];
    opacity?: number;
    stroke?: string;
    strokeWidth?: number;
  }
) {
  const { stackId = 'a', barSize = 20, radius = 3, opacity = 1, stroke = '#ffffff', strokeWidth = 2 } = options || {};

  return {
    dataKey,
    stackId,
    barSize,
    fill: color,
    ...(opacity < 1 && { fillOpacity: opacity }),
    radius,
    stroke,
    strokeWidth,
  };
}

/**
 * Color palettes for different chart types
 */
export const COLOR_PALETTES = {
  volume: ['#8b5cf6', '#06b6d4', '#facc15', '#f97316', '#ef4444'],
  delivery: {
    email: '#8b5cf6',
    push: '#06b6d4',
    sms: '#facc15',
    inApp: '#f97316',
    chat: '#10b981',
  },
  workflow: {
    success: '#34d399',
    pending: '#facc15',
    error: '#ef4444',
  },
  interaction: {
    messageSeen: '#60a5fa',
    messageRead: '#34d399',
    messageSnoozed: '#a78bfa',
    messageArchived: '#f97316',
  },
} as const;
