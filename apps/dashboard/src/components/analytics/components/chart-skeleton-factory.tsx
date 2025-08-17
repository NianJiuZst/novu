import { Skeleton } from '../../primitives/skeleton';

type ChartSkeletonConfig = {
  type: 'line' | 'stacked-bar' | 'horizontal-bar';
  itemCount: number;
  height: number;
  className?: string;
};

/**
 * Universal skeleton component factory for different chart types
 */
export function ChartSkeleton({ type, itemCount, height, className = '' }: ChartSkeletonConfig) {
  switch (type) {
    case 'line':
      return <LineChartSkeleton itemCount={itemCount} height={height} className={className} />;

    case 'stacked-bar':
      return <StackedBarChartSkeleton itemCount={itemCount} height={height} className={className} />;

    case 'horizontal-bar':
      return <HorizontalBarChartSkeleton itemCount={itemCount} height={height} className={className} />;

    default:
      return <DefaultChartSkeleton height={height} className={className} />;
  }
}

function LineChartSkeleton({ itemCount, height, className }: { itemCount: number; height: number; className: string }) {
  return (
    <div className={`flex items-end justify-between gap-2 px-2 ${className}`} style={{ height: `${height}px` }}>
      {Array.from({ length: itemCount }).map((_, i) => {
        const skeletonHeight = Math.random() * (height * 0.8) + height * 0.2;

        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <Skeleton className="w-full rounded-sm" style={{ height: `${skeletonHeight}px` }} />
          </div>
        );
      })}
    </div>
  );
}

function StackedBarChartSkeleton({
  itemCount,
  height,
  className,
}: {
  itemCount: number;
  height: number;
  className: string;
}) {
  return (
    <div className={`flex items-end justify-between gap-1 px-2 ${className}`} style={{ height: `${height}px` }}>
      {Array.from({ length: itemCount }).map((_, i) => {
        const totalHeight = Math.random() * (height * 0.6) + height * 0.3;
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

function HorizontalBarChartSkeleton({
  itemCount,
  height,
  className,
}: {
  itemCount: number;
  height: number;
  className: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} style={{ height: `${height}px` }}>
      {Array.from({ length: itemCount }).map((_, i) => {
        const width = Math.random() * 60 + 20; // Random width between 20-80%

        return (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-20 flex-shrink-0 rounded-sm" />
            <Skeleton className="h-4 flex-grow rounded-sm" style={{ width: `${width}%` }} />
          </div>
        );
      })}
    </div>
  );
}

function DefaultChartSkeleton({ height, className }: { height: number; className: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
      <Skeleton className="h-full w-full rounded-sm" />
    </div>
  );
}
