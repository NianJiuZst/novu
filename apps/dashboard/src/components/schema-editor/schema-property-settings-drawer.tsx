import { forwardRef, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/primitives/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/primitives/sheet';
import { Input } from '@/components/primitives/input';
import { Textarea } from '@/components/primitives/textarea';
import { Switch } from '@/components/primitives/switch';
import { Label } from '@/components/primitives/label'; // Assuming Label primitive exists
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/primitives/form/form';
import type { SchemaProperty, SchemaValueType } from './types';
import { cn } from '@/utils/ui';

// Define a Zod schema for validation if desired (optional for now, can add later)
const settingsSchema = z.object({
  description: z.string().optional(),
  defaultValue: z.any().optional(), // More specific type later if needed
  format: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  pattern: z.string().optional(),
  required: z.boolean().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SchemaPropertySettingsDrawerProps {
  property: SchemaProperty | null; // Can be null if no property selected
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedSettings: Partial<SchemaProperty>) => void;
}

// Helper function to parse default value based on property type
function parseDefaultValue(value: any, type: SchemaValueType | undefined): any {
  if (value === undefined || value === null) {
    return undefined;
  }

  const stringValue = String(value);

  // If the input string is empty
  if (stringValue.trim() === '') {
    // For string type, an empty input means an empty string default.
    // For other types, an empty input means no default (undefined).
    return type === 'string' ? '' : undefined;
  }

  switch (type) {
    case 'integer':
      const intValue = parseInt(stringValue, 10);
      return Number.isNaN(intValue) ? stringValue : intValue; // Fallback to original string if parsing fails
    case 'number':
      const floatValue = parseFloat(stringValue);
      return Number.isNaN(floatValue) ? stringValue : floatValue; // Fallback to original string if parsing fails
    case 'boolean':
      if (stringValue.toLowerCase() === 'true') return true;
      if (stringValue.toLowerCase() === 'false') return false;
      return stringValue; // Fallback if not 'true' or 'false'
    // For 'string', 'enum', 'array', 'object', 'null', we'll keep the string value.
    // 'array' and 'object' default values would typically be JSON strings.
    default:
      return stringValue;
  }
}

export const SchemaPropertySettingsDrawer = forwardRef<HTMLDivElement, SchemaPropertySettingsDrawerProps>(
  (props, ref) => {
    const { property, open, onOpenChange, onSave } = props;

    const form = useForm<SettingsFormData>({
      resolver: zodResolver(settingsSchema),
      defaultValues: {},
    });

    useEffect(() => {
      if (property) {
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
      }
    }, [property, form.reset, open]); // Reset form when property or open state changes

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

    if (!property) return null;

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent ref={ref} className="flex w-[480px] flex-col p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-neutral-200 px-6 py-4">
            <SheetTitle>Edit Settings: {property.name}</SheetTitle>
            <SheetDescription>Modify additional schema attributes for this property.</SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
              <div className="space-y-4 p-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Property description" />
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
                      <FormLabel>Default Value</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Default value" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conditional fields based on property type */}
                {(property.type === 'string' || property.type === 'array') && (
                  <>
                    <FormField
                      control={form.control}
                      name="minLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Length</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                              }
                              placeholder="Minimum length"
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
                          <FormLabel>Max Length</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                              }
                              placeholder="Maximum length"
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
                        <FormLabel>Pattern (Regex)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Regular expression" />
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
                        <FormLabel>Format</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., date-time, email" />
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
                          <FormLabel>Minimum Value</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                              }
                              placeholder="Minimum value"
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
                          <FormLabel>Maximum Value</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                              }
                              placeholder="Maximum value"
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <FormLabel>Required</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <SheetFooter className="border-t border-neutral-200 p-6">
                <Button type="submit" className="w-full">
                  Save Settings
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    );
  }
);
