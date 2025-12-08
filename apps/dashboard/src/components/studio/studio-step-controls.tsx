import { RJSFSchema } from '@rjsf/utils';
import { useState } from 'react';
import { RiInputField } from 'react-icons/ri';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/primitives/accordion';
import { Input } from '@/components/primitives/input';
import { Label } from '@/components/primitives/label';
import { Switch } from '@/components/primitives/switch';
import { Textarea } from '@/components/primitives/textarea';
import { cn } from '@/utils/ui';

type StudioStepControlsProps = {
  schema: RJSFSchema;
  formData: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  className?: string;
};

type SchemaProperty = {
  type: string;
  title?: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  maxLength?: number;
};

function renderField(
  key: string,
  property: SchemaProperty,
  value: unknown,
  onChange: (key: string, value: unknown) => void
) {
  const type = property.type;
  const label = property.title || key;
  const description = property.description;

  switch (type) {
    case 'string':
      if (property.enum) {
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={key} className="text-xs">
              {label}
            </Label>
            <select
              id={key}
              value={value as string}
              onChange={(e) => onChange(key, e.target.value)}
              className="border-neutral-alpha-200 bg-background text-foreground-950 flex h-9 w-full rounded-md border px-3 py-1 text-sm"
            >
              {property.enum.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {description && <span className="text-foreground-600 text-xs">{description}</span>}
          </div>
        );
      }

      return (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={key} className="text-xs">
            {label}
          </Label>
          {property.maxLength && property.maxLength > 100 ? (
            <Textarea
              id={key}
              value={value as string}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={property.default || ''}
            />
          ) : (
            <Input
              id={key}
              value={value as string}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={property.default || ''}
            />
          )}
          {description && <span className="text-foreground-600 text-xs">{description}</span>}
        </div>
      );

    case 'number':
    case 'integer':
      return (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={key} className="text-xs">
            {label}
          </Label>
          <Input
            id={key}
            type="number"
            value={value as number}
            onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
            placeholder={property.default?.toString() || ''}
          />
          {description && <span className="text-foreground-600 text-xs">{description}</span>}
        </div>
      );

    case 'boolean':
      return (
        <div key={key} className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor={key} className="text-xs">
              {label}
            </Label>
            {description && <span className="text-foreground-600 text-xs">{description}</span>}
          </div>
          <Switch id={key} checked={value as boolean} onCheckedChange={(checked) => onChange(key, checked)} />
        </div>
      );

    default:
      return (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={key} className="text-xs">
            {label}
          </Label>
          <Input
            id={key}
            value={typeof value === 'string' ? value : JSON.stringify(value)}
            onChange={(e) => {
              try {
                onChange(key, JSON.parse(e.target.value));
              } catch {
                onChange(key, e.target.value);
              }
            }}
            placeholder={property.default?.toString() || ''}
          />
          {description && <span className="text-foreground-600 text-xs">{description}</span>}
        </div>
      );
  }
}

export function StudioStepControls({ schema, formData, onChange, className }: StudioStepControlsProps) {
  const [accordionValue, setAccordionValue] = useState<string>('controls');

  const hasControls = Object.keys(schema?.properties ?? {}).length > 0;

  const handleFieldChange = (key: string, value: unknown) => {
    onChange({
      ...formData,
      [key]: value,
    });
  };

  if (!hasControls) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center p-4', className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <RiInputField className="text-foreground-400 size-8" />
          <div className="flex flex-col gap-1">
            <span className="text-foreground-950 text-sm font-medium">No controls defined</span>
            <span className="text-foreground-600 text-xs">Define step controls in your code to render fields here</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full w-full flex-col overflow-auto p-4', className)}>
      <Accordion
        className="bg-neutral-alpha-50 border-neutral-alpha-200 flex w-full flex-col gap-2 rounded-lg border p-3 text-sm"
        type="single"
        value={accordionValue}
        onValueChange={setAccordionValue}
        collapsible
      >
        <AccordionItem value="controls">
          <AccordionTrigger className="flex w-full items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <RiInputField className="text-feature size-5" />
              <span className="text-sm font-medium">Step Controls</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="bg-background flex flex-col gap-3 rounded-md border border-dashed p-3">
              {Object.entries(schema.properties || {}).map(([key, property]) =>
                renderField(key, property as SchemaProperty, formData[key], handleFieldChange)
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
