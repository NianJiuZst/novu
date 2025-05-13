import { forwardRef, useState, useCallback } from 'react';
import { RiListView } from 'react-icons/ri';

import { Button } from '@/components/primitives/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter } from '@/components/primitives/sheet';
import { cn } from '@/utils/ui';
import { SchemaEditor, type SchemaProperty } from '@/components/schema-editor';

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

  return (
    <Sheet modal={false} open={open} onOpenChange={onOpenChange}>
      <div
        className={cn('fade-in animate-in fixed inset-0 z-50 bg-black/20 transition-opacity duration-300', {
          'pointer-events-none opacity-0': !open,
        })}
      />
      <SheetContent ref={ref} className="flex w-[580px] flex-col p-0">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 px-6">
          <RiListView className="size-5 shrink-0" />
          <h2 className="flex-1 truncate text-base font-semibold">Manage Payload Schema</h2>
        </div>
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
