import { forwardRef, useEffect } from 'react';
import { useForm, Controller, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/primitives/button';
import { PopoverContent } from '@/components/primitives/popover';
import { Input } from '@/components/primitives/input';
import { Textarea } from '@/components/primitives/textarea';
import { Switch } from '@/components/primitives/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/primitives/form/form';
import type { SchemaProperty, SchemaValueType } from './types';
import { RiDeleteBin2Line } from 'react-icons/ri';

const settingsSchema = z.object({
  description: z.string().optional(),
  defaultValue: z.any().optional(),
  format: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  pattern: z.string().optional(),
  required: z.boolean().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SchemaPropertySettingsPopoverProps {
  property: SchemaProperty | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedSettings: Partial<SchemaProperty>) => void;
  onDelete: () => void;
  pathPrefix?: string;
  control?: Control<any>;
}

function parseDefaultValue(value: any, type: SchemaValueType | undefined): any {
  if (value === undefined || value === null) {
    return undefined;
  }

  const stringValue = String(value);

  if (stringValue.trim() === '') {
    return type === 'string' ? '' : undefined;
  }

  switch (type) {
    case 'integer': {
      const intValue = parseInt(stringValue, 10);
      return Number.isNaN(intValue) ? stringValue : intValue;
    }

    case 'number': {
      const floatValue = parseFloat(stringValue);
      return Number.isNaN(floatValue) ? stringValue : floatValue;
    }

    case 'boolean':
      if (stringValue.toLowerCase() === 'true') return true;
      if (stringValue.toLowerCase() === 'false') return false;
      return stringValue;
    default:
      return stringValue;
  }
}

export const SchemaPropertySettingsPopover = forwardRef<HTMLDivElement, SchemaPropertySettingsPopoverProps>(
  (props, ref) => {
    const { property, open, onOpenChange, onSave, onDelete } = props;

    const form = useForm<SettingsFormData>({
      resolver: zodResolver(settingsSchema),
      defaultValues: {},
    });

    useEffect(() => {
      if (property && open) {
        form.reset({
          description: property.description || '',
          defaultValue:
            property.defaultValue === undefined || property.defaultValue === null ? '' : String(property.defaultValue),
          format: property.format || '',
          minLength: property.minLength,
          maxLength: property.maxLength,
          minimum: property.minimum,
          maximum: property.maximum,
          pattern: property.pattern || '',
          required: property.required || false,
        });
      } else if (!open) {
        // Optionally clear form or specific fields when popover closes if needed
        // form.reset({}); // or reset to initial/empty state
      }
    }, [property, form.reset, open]);

    const onSubmit = (data: SettingsFormData) => {
      const processedData: Partial<SchemaProperty> = {
        description: data.description?.trim() === '' ? undefined : data.description,
        defaultValue: parseDefaultValue(data.defaultValue, property?.type),
        format: data.format?.trim() === '' ? undefined : data.format,
        minLength: data.minLength === undefined || data.minLength === null ? undefined : Number(data.minLength),
        maxLength: data.maxLength === undefined || data.maxLength === null ? undefined : Number(data.maxLength),
        minimum: data.minimum === undefined || data.minimum === null ? undefined : Number(data.minimum),
        maximum: data.maximum === undefined || data.maximum === null ? undefined : Number(data.maximum),
        pattern: data.pattern?.trim() === '' ? undefined : data.pattern,
        required: data.required,
      };

      onSave(processedData);
      onOpenChange(false);
    };

    const handleDelete = () => {
      onDelete();
      onOpenChange(false);
    };

    if (!property) return null;

    return (
      <PopoverContent ref={ref} className="w-[350px] p-0" side="bottom" align="start">
        <div className="bg-bg-weak border-b border-b-neutral-100">
          <div className="flex flex-row items-center justify-between space-y-0 px-1.5 py-1">
            <div className="flex w-full items-center justify-between gap-1">
              <span className="text-subheading-2xs text-text-soft">SCHEMA CONFIGURATION</span>
              <Button variant="secondary" mode="ghost" className="h-5 p-1" onClick={handleDelete}>
                <RiDeleteBin2Line className="size-3.5 text-neutral-400" />
              </Button>
            </div>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
            <div className="max-h-[400px] space-y-3 overflow-y-auto p-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Property description" className="text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Default Value</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Default value" className="h-8 text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(property.type === 'string' || property.type === 'array') && (
                <>
                  <FormField
                    control={form.control}
                    name="minLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Min Length</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            placeholder="Minimum length"
                            className="h-8 text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Max Length</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            placeholder="Maximum length"
                            className="h-8 text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {property.type === 'string' && (
                <FormField
                  control={form.control}
                  name="pattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Pattern (Regex)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Regular expression" className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {property.type === 'string' && (
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Format</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., date-time, email" className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(property.type === 'integer' || property.type === 'number') && (
                <>
                  <FormField
                    control={form.control}
                    name="minimum"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Minimum Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            placeholder="Minimum value"
                            className="h-8 text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maximum"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Maximum Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            placeholder="Maximum value"
                            className="h-8 text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-3 shadow-sm">
                    <FormLabel className="text-xs">Required</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex border-t border-neutral-200 p-1.5">
              <Button type="submit" size="2xs" variant="secondary" mode="filled" className="ml-auto">
                Apply
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    );
  }
);

SchemaPropertySettingsPopover.displayName = 'SchemaPropertySettingsPopover';
