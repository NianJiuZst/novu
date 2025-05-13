import { forwardRef, useState, useCallback } from 'react';
import { RiListView, RiUpload2Line, RiDownload2Line } from 'react-icons/ri';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import { convertInternalSchemaToJsonSchemaRoot } from '@/components/schema-editor/utils/export-helpers';
import { ExternalLink } from '../shared/external-link';
import { Separator } from '../primitives/separator';
import { usePatchWorkflow } from '@/hooks/use-patch-workflow';

type PayloadSchemaDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSchema?: SchemaProperty[];
  onSave?: (schema: SchemaProperty[]) => void;
  workflowIdOrSlug: string;
};

export const PayloadSchemaDrawer = forwardRef<HTMLDivElement, PayloadSchemaDrawerProps>((props, ref) => {
  const { open, onOpenChange, initialSchema, onSave, workflowIdOrSlug } = props;
  const [currentSchema, setCurrentSchema] = useState<SchemaProperty[]>(initialSchema || []);
  const { patchWorkflow, isPending: isSavingSchema } = usePatchWorkflow();

  const handleSchemaChange = useCallback((schema: SchemaProperty[]) => {
    console.log('Schema changed in editor:', schema);
    setCurrentSchema(schema);
  }, []);

  const handleSaveChanges = async () => {
    console.log('handleSaveChanges called'); // Log when function starts

    if (!workflowIdOrSlug) {
      console.error('Workflow ID/Slug is missing. Cannot save.');
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
    const payloadSchemaForApi = convertInternalSchemaToJsonSchemaRoot(currentSchema);

    console.log('Attempting to save schema for workflow:', workflowIdOrSlug);
    console.log('Converted payload schema being sent to API:', JSON.stringify(payloadSchemaForApi, null, 2));

    try {
      console.log('Calling patchWorkflow mutation...');
      await patchWorkflow({
        workflowSlug: workflowIdOrSlug,
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
    <Sheet modal={false} open={open} onOpenChange={onOpenChange}>
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
            <h3 className="text-label-xs text-base font-semibold">Payload schema</h3>
            <DropdownMenu>
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
                {/* <DropdownMenuItem disabled className="cursor-not-allowed">
                <RiUpload2Line className="mr-2 h-4 w-4" />
                Import from JSON Schema (Soon)
              </DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <SchemaEditor initialSchema={currentSchema} onChange={handleSchemaChange} />
        </SheetMain>
        <SheetFooter className="border-t border-neutral-200 p-6">
          <Button onClick={handleSaveChanges} className="w-full" disabled={isSavingSchema || !currentSchema?.length}>
            {isSavingSchema ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});
