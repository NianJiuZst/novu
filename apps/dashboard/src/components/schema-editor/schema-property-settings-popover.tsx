import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useEffect } from 'react';
import { useForm, type Control } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/primitives/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/primitives/form/form';
import { Input, InputPure, InputRoot, InputWrapper } from '@/components/primitives/input';
import { PopoverContent } from '@/components/primitives/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/primitives/select';
import { Switch } from '@/components/primitives/switch';
import { Textarea } from '@/components/primitives/textarea';
import { RiDeleteBin2Line } from 'react-icons/ri';
import { Code2 } from '../icons/code-2';
import { Separator } from '../primitives/separator';
import { SCHEMA_TYPE_OPTIONS } from './constants';
import type { SchemaProperty, SchemaValueType } from './types';

const settingsSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  type: z.custom<SchemaValueType>(),
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

const NONE_FORMAT_VALUE = '_NONE_';

const JSON_SCHEMA_FORMATS = [
  NONE_FORMAT_VALUE, // Allow unsetting the format
  'date-time',
  'date',
  'time',
  'duration',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'uuid',
  'uri',
];

export const SchemaPropertySettingsPopover = forwardRef<HTMLDivElement, SchemaPropertySettingsPopoverProps>(
  (props, ref) => {
    const { property, open, onOpenChange, onSave, onDelete } = props;

    const form = useForm<SettingsFormData>({
      resolver: zodResolver(settingsSchema),
      defaultValues: {
        name: '',
        type: 'string',
      },
    });

    useEffect(() => {
      if (property && open) {
        form.reset({
          name: property.name || '',
          type: property.type || 'string',
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
        name: data.name,
        type: data.type,
        description: data.description?.trim() === '' ? undefined : data.description,
        defaultValue: parseDefaultValue(data.defaultValue, data.type),
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

    const isStringType = property.type === 'string';
    const isArrayType = property.type === 'array';
    const isNumericType = property.type === 'integer' || property.type === 'number';

    return (
      <PopoverContent ref={ref} className="w-[300px] p-0">
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
            <div className="max-h-[400px] space-y-1.5 overflow-y-auto p-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Variable</FormLabel>
                    <FormControl>
                      <InputRoot hasError={!!fieldState.error} size="2xs" className="font-mono">
                        <InputWrapper>
                          <Code2 className="h-4 w-4 shrink-0 text-gray-500" />
                          <InputPure {...field} placeholder="Property name" className="text-sm" />
                        </InputWrapper>
                      </InputRoot>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select value={field.value as string | undefined} onValueChange={field.onChange}>
                        <SelectTrigger size="2xs" className="w-full text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHEMA_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-sm">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Input {...field} placeholder="Default value" size="2xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <FormLabel className="text-xs">Required</FormLabel>
                    <FormControl>
                      <Switch className="mt-0" checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Separator />

              {(isStringType || isArrayType) && (
                <>
                  <div className="flex space-x-2">
                    <FormField
                      control={form.control}
                      name="minLength"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">{isArrayType ? 'Min Items' : 'Min Length'}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                              }
                              placeholder={isArrayType ? 'Minimum items' : 'Minimum length'}
                              size="2xs"
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
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">{isArrayType ? 'Max Items' : 'Max Length'}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                              }
                              placeholder={isArrayType ? 'Maximum items' : 'Maximum length'}
                              size="2xs"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {isStringType && (
                <>
                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Format</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || NONE_FORMAT_VALUE}
                            onValueChange={(value) => field.onChange(value === NONE_FORMAT_VALUE ? undefined : value)}
                          >
                            <SelectTrigger size="2xs" className="w-full text-sm">
                              <SelectValue placeholder="Select a format" />
                            </SelectTrigger>
                            <SelectContent>
                              {JSON_SCHEMA_FORMATS.map((format) => (
                                <SelectItem key={format} value={format}>
                                  {format === NONE_FORMAT_VALUE ? 'None' : format}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Pattern (Regex)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Regular expression" size="2xs" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {isNumericType && (
                <>
                  <div className="flex space-x-2">
                    <FormField
                      control={form.control}
                      name="minimum"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">Minimum Value</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                              }
                              placeholder="Minimum value"
                              size="2xs"
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
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">Maximum Value</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                              }
                              placeholder="Maximum value"
                              size="2xs"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Property description" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Separator />
            <div className="flex justify-end px-2 py-1.5">
              <Button type="submit" size="2xs" mode="filled" variant="secondary">
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
