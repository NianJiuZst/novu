type ChartDataWithTimestamp = {
  timestamp: string;
};

/**
 * Checks if a given timestamp represents today's date
 */
export function isCurrentDate(timestamp: string): boolean {
  const today = new Date();
  const itemDate = new Date(timestamp);

  return (
    today.getFullYear() === itemDate.getFullYear() &&
    today.getMonth() === itemDate.getMonth() &&
    today.getDate() === itemDate.getDate()
  );
}

/**
 * Finds the most recent date in the data (assumes data is sorted chronologically)
 * This is more reliable than looking for today's exact date
 */
export function findMostRecentDateIndex<T extends ChartDataWithTimestamp>(data: T[]): number {
  if (data.length === 0) return -1;

  // Find the latest timestamp
  let latestIndex = 0;
  let latestTimestamp = new Date(data[0].timestamp);

  for (let i = 1; i < data.length; i++) {
    const currentTimestamp = new Date(data[i].timestamp);
    if (currentTimestamp > latestTimestamp) {
      latestTimestamp = currentTimestamp;
      latestIndex = i;
    }
  }

  return latestIndex;
}

/**
 * Finds the index of the current date in chart data
 */
export function findCurrentDateIndex<T extends ChartDataWithTimestamp>(data: T[]): number {
  return data.findIndex((item) => isCurrentDate(item.timestamp));
}

/**
 * Adds current date indicator to chart data
 */
export function addCurrentDateIndicator<T extends ChartDataWithTimestamp>(
  data: T[]
): (T & { isCurrentDate?: boolean })[] {
  return data.map((item) => ({
    ...item,
    isCurrentDate: isCurrentDate(item.timestamp),
  }));
}

/**
 * Creates a dotted line configuration for current date data points
 */
export function getCurrentDateLineProps(isCurrentDate: boolean) {
  return isCurrentDate ? { strokeDasharray: '4 4', strokeOpacity: 0.7 } : {};
}

/**
 * Splits chart data into segments at the current date boundary
 * Returns { beforeCurrent, current, afterCurrent }
 */
export function splitDataAtCurrentDate<T extends ChartDataWithTimestamp>(data: T[]) {
  const currentDateIndex = findCurrentDateIndex(data);

  if (currentDateIndex === -1) {
    return {
      beforeCurrent: data,
      current: null,
      afterCurrent: [],
    };
  }

  return {
    beforeCurrent: data.slice(0, currentDateIndex),
    current: data[currentDateIndex],
    afterCurrent: data.slice(currentDateIndex + 1),
  };
}
