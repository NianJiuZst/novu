import { RiCodeBoxLine, RiLayoutGridLine } from 'react-icons/ri';
import { Tabs, TabsList, TabsTrigger } from '@/components/primitives/tabs';

export type ConditionsMode = 'ui' | 'json';

type ConditionsModeSwitcherProps = {
  mode: ConditionsMode;
  onModeChange: (mode: ConditionsMode) => void;
};

export function ConditionsModeSwitcher({ mode, onModeChange }: ConditionsModeSwitcherProps) {
  return (
    <Tabs value={mode} onValueChange={(value: string) => value && onModeChange(value as ConditionsMode)}>
      <TabsList variant="default" className="h-auto w-auto">
        <TabsTrigger value="ui" size="sm" className="gap-1.5">
          <RiLayoutGridLine className="size-3.5" />
          <span>UI</span>
        </TabsTrigger>
        <TabsTrigger value="json" size="sm" className="gap-1.5">
          <RiCodeBoxLine className="size-3.5" />
          <span>JSON</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
