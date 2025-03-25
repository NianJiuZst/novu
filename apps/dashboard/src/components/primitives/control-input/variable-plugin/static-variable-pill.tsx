import { cn } from '../../../../utils/ui';

export const VARIABLE_ICON_STYLES =
  'before:mr-0.5 before:h-[calc(1em)] before:w-[calc(1em-2px)] before:min-w-[calc(1em-2px)] before:bg-[url("/images/code.svg")] before:bg-contain before:bg-center before:bg-no-repeat before:content-[""]';

interface StaticVariablePillProps {
  className?: string;
  hasFilters?: boolean;
  text: string;
}

export function StaticVariablePill({ className, hasFilters, text }: StaticVariablePillProps) {
  return (
    <span
      className={cn(
        'border-stroke-soft bg-weak text-text-sub inline-flex h-4 items-center rounded-[0.25rem] border px-1.5 font-[inherit] font-medium leading-[1] antialiased',
        VARIABLE_ICON_STYLES,
        hasFilters && 'after:bg-feature-base after:ml-0.5 after:h-1 after:w-1 after:rounded-full after:content-[""]',
        className
      )}
    >
      {text}
    </span>
  );
}
