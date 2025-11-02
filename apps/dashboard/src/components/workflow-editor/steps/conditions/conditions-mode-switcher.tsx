import { RiCodeBoxLine, RiLayoutGridLine } from 'react-icons/ri';
import { ToggleGroup, ToggleGroupItem } from '@/components/primitives/toggle-group';

export type ConditionsMode = 'ui' | 'json';

type ConditionsModeSwitcherProps = {
  mode: ConditionsMode;
  onModeChange: (mode: ConditionsMode) => void;
};

export function ConditionsModeSwitcher({ mode, onModeChange }: ConditionsModeSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(value) => value && onModeChange(value as ConditionsMode)}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="ui" aria-label="UI Mode" className="gap-1.5 px-3 py-1 text-xs">
        <RiLayoutGridLine className="size-3.5" />
        <span>UI</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="json" aria-label="JSON Mode" className="gap-1.5 px-3 py-1 text-xs">
        <RiCodeBoxLine className="size-3.5" />
        <span>JSON</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
