import { forwardRef, useState, useCallback, useEffect } from 'react';
import { RiFileMarkedLine, RiInformation2Line } from 'react-icons/ri';

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
import { ExternalLink } from '../shared/external-link';
import { Separator } from '../primitives/separator';
import { usePatchWorkflow } from '@/hooks/use-patch-workflow';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/primitives/tooltip';
import type { WorkflowResponseDto as NovuWorkflowResponseDto } from '@novu/shared';
import { SchemaConverter } from '@/components/schema-editor/utils/schema-conversion';

// Define a more specific type for the workflow object expected by this drawer
interface WorkflowForSchemaEditing extends NovuWorkflowResponseDto {
  payloadSchema?: Record<string, any>; // Or a more specific JSON Schema type
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
      const { internalSchema, unsupportedRootProperties } = SchemaConverter.fromJSON(workflow.payloadSchema);
      setCurrentSchema(internalSchema);
      setUnsupportedProperties(unsupportedRootProperties);
    } else {
      setCurrentSchema([]);
      setUnsupportedProperties({});
    }
  }, [workflow]);

  const handleSchemaChange = useCallback((schema: SchemaProperty[]) => {
    console.log('Schema changed in editor:', schema);
    setCurrentSchema(schema);
  }, []);

  const handleSaveChanges = async () => {
    console.log('handleSaveChanges called');

    if (!workflow.slug) {
      console.error('Workflow slug is missing. Cannot save.');
      return;
    }

    if (!currentSchema && Object.keys(unsupportedProperties).length === 0) {
      console.warn('Schema is empty and no unsupported properties. Nothing to save.');
      return;
    }

    console.log('Current schema state before conversion:', currentSchema);
    console.log('Unsupported root properties before conversion:', unsupportedProperties);

    const payloadSchemaForApi = SchemaConverter.toJSON(currentSchema, unsupportedProperties);

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
      onSave?.(currentSchema);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save payload schema due to API error:', error);
    }
  };

  const handleExportToJsonSchema = () => {
    const jsonSchema = SchemaConverter.toJSON(currentSchema, unsupportedProperties);
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
    console.log('Exporting to Zod (placeholder):', currentSchema);
    // Actual Zod schema generation logic will go here
    // This would also likely use a utility function, potentially part of or alongside SchemaConverter
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

            {/* TODO: Re-enable or reimplement Import/Export if needed, using SchemaConverter */}
            {/* <DropdownMenu>
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
              disabled={isSavingSchema || (!currentSchema?.length && Object.keys(unsupportedProperties).length === 0)}
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
