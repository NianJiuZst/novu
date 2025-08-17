import { useMemo } from 'react';
import { NovuTooltip, type NovuTooltipRow } from '../../primitives/chart';

type TooltipPayload = {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
  payload?: Record<string, unknown>;
};

type UniversalChartTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  dataKeyPatterns?: {
    solid: string[];
    dotted: string[];
  };
  customRenderer?: (payload: TooltipPayload[], label?: string) => NovuTooltipRow[];
  showTotal?: boolean;
};

/**
 * Universal tooltip component that handles common tooltip patterns across charts
 */
export function UniversalChartTooltip({
  active,
  payload,
  label,
  dataKeyPatterns,
  customRenderer,
  showTotal = false,
}: UniversalChartTooltipProps) {
  const tooltipRows = useMemo((): NovuTooltipRow[] => {
    if (!active || !payload || !payload.length) return [];

    // If custom renderer is provided, use it
    if (customRenderer) {
      return customRenderer(payload, label);
    }

    // Handle solid/dotted patterns (prefer solid, fallback to dotted)
    if (dataKeyPatterns) {
      const { solid, dotted } = dataKeyPatterns;

      const solidEntries = payload.filter(
        (entry) => solid.some((pattern) => entry.dataKey?.includes(pattern)) && entry.value != null
      );

      const dottedEntries = payload.filter(
        (entry) => dotted.some((pattern) => entry.dataKey?.includes(pattern)) && entry.value != null
      );

      const filteredPayload = solidEntries.length > 0 ? solidEntries : dottedEntries;

      return filteredPayload.map((entry) => ({
        key: entry.dataKey || 'unknown',
        label: cleanupLabel(entry.name || entry.dataKey || 'Unknown'),
        value: entry.value || 0,
        color: entry.color || '#000',
      }));
    }

    // Default handling - use all payload entries
    return payload
      .filter((entry) => entry.value != null)
      .map((entry) => ({
        key: entry.dataKey || 'unknown',
        label: entry.name || entry.dataKey || 'Unknown',
        value: entry.value || 0,
        color: entry.color || '#000',
      }));
  }, [active, payload, label, dataKeyPatterns, customRenderer]);

  if (!active || tooltipRows.length === 0) {
    return null;
  }

  return <NovuTooltip active={active} label={label} rows={tooltipRows} showTotal={showTotal} />;
}

/**
 * Cleans up label names by removing technical suffixes
 */
function cleanupLabel(label: string): string {
  return label
    .replace(/Solid$/, '')
    .replace(/Dotted$/, '')
    .replace(/Complete$/, '')
    .replace(/Incomplete$/, '')
    .replace(/ \(Current\)$/, '')
    .trim();
}
