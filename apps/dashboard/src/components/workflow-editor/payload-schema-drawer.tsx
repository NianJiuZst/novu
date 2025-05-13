import { forwardRef, useState, useCallback } from 'react';
import { RiListView, RiUpload2Line, RiDownload2Line } from 'react-icons/ri';

import { Button } from '@/components/primitives/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
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

type PayloadSchemaDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSchema?: SchemaProperty[];
  onSave?: (schema: SchemaProperty[]) => void;
};

export const PayloadSchemaDrawer = forwardRef<HTMLDivElement, PayloadSchemaDrawerProps>((props, ref) => {
  const { open, onOpenChange, initialSchema, onSave } = props;
  const [currentSchema, setCurrentSchema] = useState<SchemaProperty[]>(initialSchema || []);

  const handleSchemaChange = useCallback((schema: SchemaProperty[]) => {
    setCurrentSchema(schema);
  }, []);

  const handleSaveChanges = () => {
    onSave?.(currentSchema);
    onOpenChange(false);
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
      <SheetContent ref={ref} className="flex w-[720px] flex-col p-0 sm:max-w-3xl">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <RiListView className="h-6 w-6 text-neutral-600" />
            <SheetTitle className="text-lg font-semibold">Manage Payload Schema</SheetTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" mode="outline" leadingIcon={RiDownload2Line} className="text-sm">
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
        </SheetHeader>
        <SheetDescription className="sr-only">Define the structure of your workflow payload.</SheetDescription>
        <div className="flex-1 overflow-y-auto p-6">
          <SchemaEditor initialSchema={currentSchema} onChange={handleSchemaChange} />
        </div>
        <SheetFooter className="border-t border-neutral-200 p-6">
          <Button onClick={handleSaveChanges} className="w-full">
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});
