import { forwardRef, useState, useCallback, useEffect } from 'react';
import {
  RiListView,
  RiUpload2Line,
  RiDownload2Line,
  RiBookmarkLine,
  RiFileMarkedLine,
  RiInformation2Line,
  RiInformationFill,
} from 'react-icons/ri';

import { Button } from '@/components/primitives/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetMain,
  SheetTitle,
} from '@/components/primitives/sheet';
import { cn } from '@/utils/ui';
import { SchemaEditor, type SchemaProperty } from '@/components/schema-editor';
import { convertInternalSchemaToJsonSchemaRoot } from '@/components/schema-editor/utils/export-helpers';
import { ExternalLink } from '../shared/external-link';
import { Separator } from '../primitives/separator';
import { usePatchWorkflow } from '@/hooks/use-patch-workflow';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/primitives/tooltip';
import type { WorkflowResponseDto as NovuWorkflowResponseDto } from '@novu/shared';
import type { SchemaValueType } from '@/components/schema-editor/types'; // Import SchemaValueType

// Define a more specific type for the workflow object expected by this drawer
interface WorkflowForSchemaEditing extends NovuWorkflowResponseDto {
  payloadSchema?: Record<string, any>; // Or a more specific JSON Schema type
}

function jsonSchemaTypeToSchemaValueType(jsonType: string | string[]): SchemaValueType {
  const type = Array.isArray(jsonType) ? jsonType.find((t) => t !== 'null') || 'string' : jsonType;

  switch (type) {
    case 'integer':
      return 'integer';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'array';
    case 'object':
      return 'object';
    case 'null':
      return 'null';
    case 'string':
    default:
      // Check for enum here as enums are often strings but should be 'enum' type for our editor
      return 'string';
  }
}

function parseJsonSchemaProperties(properties: Record<string, any>, requiredFields: Set<string>): SchemaProperty[] {
  const result: SchemaProperty[] = [];

  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const propSchema = properties[key];
      if (typeof propSchema !== 'object' || propSchema === null) continue;

      let editorType = jsonSchemaTypeToSchemaValueType(propSchema.type);

      if (propSchema.enum) {
        editorType = 'enum';
      }

      const schemaProperty: SchemaProperty = {
        id: key, // Consider generating a more unique ID if needed
        name: key,
        type: editorType,
        required: requiredFields.has(key),
        description: propSchema.description,
        defaultValue: propSchema.default,
        format: propSchema.format,
        minLength: propSchema.minLength,
        maxLength: propSchema.maxLength,
        minimum: propSchema.minimum,
        maximum: propSchema.maximum,
        pattern: propSchema.pattern,
      };

      if (editorType === 'enum' && Array.isArray(propSchema.enum)) {
        schemaProperty.enumValues = propSchema.enum.map(String); // Ensure enum values are strings
      }

      if (editorType === 'object' && propSchema.properties) {
        const reqArray: string[] = (propSchema.required || []).map((val: any) => String(val));
        const nestedRequired = new Set<string>(reqArray);
        schemaProperty.children = parseJsonSchemaProperties(propSchema.properties, nestedRequired);
      }

      if (editorType === 'array' && propSchema.items) {
        // Assuming items is a single schema object
        const itemSchema = propSchema.items;

        if (typeof itemSchema === 'object' && itemSchema !== null) {
          let itemEditorType = jsonSchemaTypeToSchemaValueType(itemSchema.type);

          if (itemSchema.enum) {
            itemEditorType = 'enum';
          }

          schemaProperty.arrayItemType = itemEditorType;

          if (itemEditorType === 'object' && itemSchema.properties) {
            const itemReqArray: string[] = (itemSchema.required || []).map((val: any) => String(val));
            const nestedItemRequired = new Set<string>(itemReqArray);
            schemaProperty.arrayItemSchema = parseJsonSchemaProperties(itemSchema.properties, nestedItemRequired);
          }
          // If array items are enums, store their values if SchemaProperty supports it directly for arrayItemType='enum'
          // Current SchemaProperty seems to store enumValues at the top level,
          // so this might need adjustment based on how array of enums is best represented.
          // For now, if arrayItemType is enum, the UI for SchemaEditor would need to handle this.
        } else if (typeof itemSchema === 'boolean' && !itemSchema) {
          // "items": false disallows any items, can be ignored or represented if model supports it
        } else {
          // if items is not an object (e.g. items: true, or a reference $ref), this needs more handling.
          // For now, we assume 'items' is a schema object.
        }
      }

      result.push(schemaProperty);
    }
  }

  return result;
}

function convertJsonSchemaToInternalSchema(jsonSchema: any): {
  internalSchema: SchemaProperty[];
  unsupportedProperties: Record<string, any>;
} {
  const internalSchema: SchemaProperty[] = [];
  const unsupportedProperties: Record<string, any> = {};

  if (typeof jsonSchema !== 'object' || jsonSchema === null || jsonSchema.type !== 'object') {
    // Expecting a root object schema
    if (typeof jsonSchema === 'object' && jsonSchema !== null) {
      // If it's not type object but still an object, capture all its props as unsupported
      for (const key in jsonSchema) {
        if (Object.prototype.hasOwnProperty.call(jsonSchema, key)) {
          unsupportedProperties[key] = jsonSchema[key];
        }
      }
    }

    return { internalSchema, unsupportedProperties };
  }

  const properties = jsonSchema.properties || {};
  const rootReqArray: string[] = (jsonSchema.required || []).map((val: any) => String(val));
  const requiredFields = new Set<string>(rootReqArray);

  const parsedProps = parseJsonSchemaProperties(properties, requiredFields);
  internalSchema.push(...parsedProps);

  // Capture other top-level properties from the JSON schema root as unsupported
  const knownRootProps = ['type', 'properties', 'required', '$schema', 'title', 'description', 'id', '$id']; // 'id' or '$id' are common for schema identifiers

  for (const key in jsonSchema) {
    if (Object.prototype.hasOwnProperty.call(jsonSchema, key)) {
      if (!knownRootProps.includes(key) && !properties[key]) {
        // ensure it's not a property we've processed
        unsupportedProperties[key] = jsonSchema[key];
      }
    }
  }

  // Ensure root $schema, title, description are captured if present and not handled by SchemaProperty directly at root
  if (jsonSchema.$schema) unsupportedProperties.$schema = jsonSchema.$schema;
  if (jsonSchema.title) unsupportedProperties.title = jsonSchema.title;

  // Root description is often shown as overall schema description, not part of SchemaProperty array.
  // Decide if root description needs to be stored specially or as unsupported.
  // For now, adding to unsupported.
  if (jsonSchema.description && !internalSchema.find((p) => p.name === 'description')) {
    unsupportedProperties.description = jsonSchema.description;
  }

  return { internalSchema, unsupportedProperties };
}

type PayloadSchemaDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: WorkflowForSchemaEditing;
  onSave?: (schema: SchemaProperty[]) => void;
};

export const PayloadSchemaDrawer = forwardRef<HTMLDivElement, PayloadSchemaDrawerProps>((props, ref) => {
  const { open, onOpenChange, workflow, onSave } = props;
  const [currentSchema, setCurrentSchema] = useState<SchemaProperty[]>([]);
  const [unsupportedProperties, setUnsupportedProperties] = useState<Record<string, any>>({});
  const { patchWorkflow, isPending: isSavingSchema } = usePatchWorkflow();

  useEffect(() => {
    if (workflow?.payloadSchema) {
      const { internalSchema, unsupportedProperties: newUnsupportedProperties } = convertJsonSchemaToInternalSchema(
        workflow.payloadSchema
      );
      setCurrentSchema(internalSchema);
      setUnsupportedProperties(newUnsupportedProperties);
    } else {
      // Reset if workflow or payloadSchema is not present
      setCurrentSchema([]);
      setUnsupportedProperties({});
    }
  }, [workflow]);

  const handleSchemaChange = useCallback((schema: SchemaProperty[]) => {
    console.log('Schema changed in editor:', schema);
    setCurrentSchema(schema);
  }, []);

  const handleSaveChanges = async () => {
    console.log('handleSaveChanges called'); // Log when function starts

    if (!workflow.slug) {
      console.error('Workflow slug is missing. Cannot save.');
      // toast.error('Workflow ID/Slug is missing, cannot save schema.');
      return;
    }

    if (!currentSchema || currentSchema.length === 0) {
      console.warn('Current schema is empty. Nothing to save.');
      // toast.warn('Schema is empty. Add some properties to save.');
      // onOpenChange(false); // Optionally close
      return;
    }

    console.log('Current schema state before conversion:', currentSchema);
    let payloadSchemaForApi = convertInternalSchemaToJsonSchemaRoot(currentSchema);

    // Merge back unsupported properties
    if (Object.keys(unsupportedProperties).length > 0) {
      payloadSchemaForApi = { ...payloadSchemaForApi, ...unsupportedProperties };
    }

    console.log('Attempting to save schema for workflow:', workflow.slug);
    console.log('Converted payload schema being sent to API:', JSON.stringify(payloadSchemaForApi, null, 2));

    try {
      console.log('Calling patchWorkflow mutation...');
      await patchWorkflow({
        workflowSlug: workflow.slug,
        workflow: {
          payloadSchema: payloadSchemaForApi as any,
        },
      });
      console.log('Payload schema saved successfully! API call succeeded.');
      // toast.success('Payload schema saved successfully!');
      onSave?.(currentSchema);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save payload schema due to API error:', error);
      // toast.error('Failed to save payload schema. Please try again.');
    }
  };

  const handleExportToJsonSchema = () => {
    const jsonSchema = convertInternalSchemaToJsonSchemaRoot(currentSchema);
    const jsonString = JSON.stringify(jsonSchema, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payload-schema.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Exported JSON Schema:', jsonString);
  };

  const handleExportToZod = () => {
    console.log('Exporting to Zod:', currentSchema);
    // Actual Zod schema generation logic will go here
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div
        className={cn('fade-in animate-in fixed inset-0 z-50 bg-black/20 transition-opacity duration-300', {
          'pointer-events-none opacity-0': !open,
        })}
      />
      <SheetContent ref={ref} className="bg-bg-weak flex w-[600px] flex-col p-0 sm:max-w-3xl">
        <SheetHeader className="space-y-1 px-3 py-4">
          <SheetTitle className="text-label-lg">Manage Payload Schema</SheetTitle>
          <SheetDescription className="text-paragraph-xs mt-0">
            Define the structure of your workflow payload.{' '}
            <ExternalLink href="https://docs.novu.co/platform/concepts/workflows">Learn more</ExternalLink>
          </SheetDescription>
        </SheetHeader>
        <Separator />

        <SheetMain className="p-3">
          <div className="mb-2 flex flex-row items-center justify-between gap-2">
            <h3 className="text-label-xs w-full">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex cursor-default flex-row items-center gap-1">
                    Payload schema <RiInformation2Line className="inline-block size-4 text-neutral-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Validating the workflow payload content, to match a specific schema. This validation ensures
                      content consistency.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>

            {/*  <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" mode="outline" leadingIcon={RiDownload2Line} size="2xs" className="text-sm">
                  Import / Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportToJsonSchema} className="cursor-pointer">
                  <RiDownload2Line className="mr-2 h-4 w-4" />
                  Export to JSON Schema
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportToZod} className="cursor-pointer">
                  <RiDownload2Line className="mr-2 h-4 w-4" />
                  Export to Zod
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>

          <SchemaEditor initialSchema={currentSchema} onChange={handleSchemaChange} />
        </SheetMain>
        <SheetFooter className="border-neutral-content-weak space-between flex border-t px-3 py-1.5">
          <div className="flex w-full flex-row items-center justify-between gap-2">
            <Link to="https://docs.novu.co/platform/concepts/payloads" target="_blank">
              <Button variant="secondary" mode="ghost" size="xs" leadingIcon={RiFileMarkedLine}>
                View Docs
              </Button>
            </Link>
            <Button
              size="xs"
              mode="gradient"
              variant="secondary"
              onClick={handleSaveChanges}
              disabled={isSavingSchema || !currentSchema?.length}
              data-test-id="save-payload-schema-btn"
            >
              {isSavingSchema ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});
