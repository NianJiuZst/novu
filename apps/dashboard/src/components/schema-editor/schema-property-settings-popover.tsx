import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useEffect, useMemo } from 'react';
import { useForm, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/primitives/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/primitives/form/form';
import { Input } from '@/components/primitives/input';
import { PopoverContent } from '@/components/primitives/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/primitives/select';
import { Switch } from '@/components/primitives/switch';
import { Textarea } from '@/components/primitives/textarea';
import { RiDeleteBin2Line } from 'react-icons/ri';
import { Separator } from '../primitives/separator';
import { SCHEMA_TYPE_OPTIONS } from './constants';
import type { JSONSchema7, JSONSchema7TypeName } from './json-schema';

const settingsSchema = z.object({
  description: z.string().optional(),
  defaultValue: z.string().optional(),
  format: z.string().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  pattern: z.string().optional(),
  _isNowRequired: z.boolean().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SchemaPropertySettingsPopoverProps {
  propertySchema: JSONSchema7;
  propertyKey: string;
  parentSchema?: JSONSchema7;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedSettings: Partial<JSONSchema7> & { _isNowRequired?: boolean }) => void;
  onDelete: () => void;
}

function parseDefaultValue(value: string | undefined, type: JSONSchema7TypeName | undefined): any {
  if (value === undefined || value === null || value.trim() === '') {
    return undefined;
  }

  switch (type) {
    case 'integer': {
      const intValue = parseInt(value, 10);
      return Number.isNaN(intValue) ? value : intValue;
    }

    case 'number': {
      const floatValue = parseFloat(value);
      return Number.isNaN(floatValue) ? value : floatValue;
    }

    case 'boolean':
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      return value;
    case 'null':
      if (value.toLowerCase() === 'null') return null;
      return value;
    case 'string':
    default:
      return value;
  }
}

const NONE_FORMAT_VALUE = '_NONE_';

const JSON_SCHEMA_FORMATS = [
  NONE_FORMAT_VALUE,
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
  'uri-reference',
  'uri-template',
  'json-pointer',
  'relative-json-pointer',
  'regex',
];

export const SchemaPropertySettingsPopover = forwardRef<HTMLDivElement, SchemaPropertySettingsPopoverProps>(
  (props, ref) => {
    const { propertySchema, propertyKey, parentSchema, open, onOpenChange, onSave, onDelete } = props;

    const { getValues: getMainFormValues } = useFormContext() || {};

    const form = useForm<SettingsFormData>({
      resolver: zodResolver(settingsSchema),
      defaultValues: {},
    });

    const isCurrentlyRequired = useMemo(() => {
      if (parentSchema && parentSchema.type === 'object' && parentSchema.required) {
        return parentSchema.required.includes(propertyKey);
      }

      return false;
    }, [parentSchema, propertyKey]);

    useEffect(() => {
      if (propertySchema && open) {
        form.reset({
          description: propertySchema.description || '',
          defaultValue:
            propertySchema.default === undefined || propertySchema.default === null
              ? ''
              : String(propertySchema.default),
          format: propertySchema.format || '',
          minLength: propertySchema.minLength,
          maxLength: propertySchema.maxLength,
          minimum: propertySchema.minimum,
          maximum: propertySchema.maximum,
          pattern: propertySchema.pattern || '',
          _isNowRequired: isCurrentlyRequired,
        });
      } else if (!open) {
        // form.reset({});
      }
    }, [propertySchema, form.reset, open, isCurrentlyRequired]);

    const onSubmit = (data: SettingsFormData) => {
      const { _isNowRequired, ...jsonData } = data;
      const currentType = propertySchema.type;

      const processedData: Partial<JSONSchema7> & { _isNowRequired?: boolean } = {
        _isNowRequired: data._isNowRequired,
      };

      if (jsonData.description !== undefined) {
        processedData.description = jsonData.description.trim() === '' ? undefined : jsonData.description.trim();
      }

      if (jsonData.defaultValue !== undefined) {
        processedData.default = parseDefaultValue(jsonData.defaultValue, currentType as JSONSchema7TypeName);
      }

      if (currentType === 'string' || currentType === 'array') {
        if (jsonData.minLength !== undefined) processedData.minLength = Number(jsonData.minLength);
        if (jsonData.maxLength !== undefined) processedData.maxLength = Number(jsonData.maxLength);
      }

      if (currentType === 'string') {
        if (jsonData.format !== undefined) {
          processedData.format =
            jsonData.format.trim() === '' || jsonData.format === NONE_FORMAT_VALUE ? undefined : jsonData.format.trim();
        }

        if (jsonData.pattern !== undefined) {
          processedData.pattern = jsonData.pattern.trim() === '' ? undefined : jsonData.pattern.trim();
        }
      }

      if (currentType === 'number' || currentType === 'integer') {
        if (jsonData.minimum !== undefined) processedData.minimum = Number(jsonData.minimum);
        if (jsonData.maximum !== undefined) processedData.maximum = Number(jsonData.maximum);
      }

      Object.keys(processedData).forEach((key) => {
        if ((processedData as any)[key] === undefined) {
          delete (processedData as any)[key];
        }
      });

      onSave(processedData);
      onOpenChange(false);
    };

    const handleDelete = () => {
      onDelete();
      onOpenChange(false);
    };

    const effectiveType = propertySchema.enum ? 'enum' : propertySchema.type;
    const isStringType = effectiveType === 'string';
    const isArrayType = effectiveType === 'array';
    const isNumericType = effectiveType === 'integer' || effectiveType === 'number';

    return (
      <PopoverContent ref={ref} className="w-[320px] p-0" sideOffset={5}>
        <div className="bg-bg-weak border-b border-b-neutral-100">
          <div className="flex flex-row items-center justify-between space-y-0 px-1.5 py-1">
            <div className="flex w-full items-center justify-between gap-1">
              <span className="text-subheading-2xs text-text-soft">
                {propertyKey ? `${propertyKey} - ` : ''} Settings
              </span>
              <Button variant="secondary" mode="ghost" className="h-5 p-1" onClick={handleDelete}>
                <RiDeleteBin2Line className="size-3.5 text-neutral-400" />
              </Button>
            </div>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
            <div className="max-h-[450px] space-y-2.5 overflow-y-auto p-3">
              <FormField
                control={form.control}
                name="defaultValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Default Value</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder={`Enter default (${String(effectiveType)})`}
                        size="2xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="_isNowRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-2.5">
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
                  <FormLabel className="mb-1 block text-xs">
                    {isArrayType ? 'Array Constraints' : 'String Constraints'}
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-2.5">
                    <FormField
                      control={form.control}
                      name="minLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-normal">
                            {isArrayType ? 'Min Items' : 'Min Length'}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value === undefined ? '' : field.value}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))
                              }
                              placeholder="e.g., 0"
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
                        <FormItem>
                          <FormLabel className="text-xs font-normal">
                            {isArrayType ? 'Max Items' : 'Max Length'}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value === undefined ? '' : field.value}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))
                              }
                              placeholder="e.g., 100"
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
                            onValueChange={(value) => field.onChange(value === NONE_FORMAT_VALUE ? '' : value)}
                          >
                            <SelectTrigger size="2xs" className="w-full text-sm">
                              <SelectValue placeholder="Select a format" />
                            </SelectTrigger>
                            <SelectContent>
                              {JSON_SCHEMA_FORMATS.map((formatVal) => (
                                <SelectItem key={formatVal} value={formatVal}>
                                  {formatVal === NONE_FORMAT_VALUE ? 'None' : formatVal}
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
                          <Input {...field} value={field.value || ''} placeholder="^\\d{3}$" size="2xs" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {isNumericType && (
                <>
                  <FormLabel className="mb-1 block text-xs">Numeric Constraints</FormLabel>
                  <div className="grid grid-cols-2 gap-2.5">
                    <FormField
                      control={form.control}
                      name="minimum"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-normal">Minimum</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value === undefined ? '' : field.value}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                              }
                              placeholder="e.g., 0"
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
                        <FormItem>
                          <FormLabel className="text-xs font-normal">Maximum</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value === undefined ? '' : field.value}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                              }
                              placeholder="e.g., 100"
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
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Property description (supports Markdown)"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Separator />
            <div className="flex justify-end px-3 py-2">
              <Button type="submit" size="2xs" mode="filled" variant="secondary">
                Apply Changes
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    );
  }
);

SchemaPropertySettingsPopover.displayName = 'SchemaPropertySettingsPopover';
