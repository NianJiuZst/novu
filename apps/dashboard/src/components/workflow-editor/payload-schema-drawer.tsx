import { forwardRef } from 'react';
import { RiListView } from 'react-icons/ri';

import { Button } from '@/components/primitives/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter } from '@/components/primitives/sheet';
import { cn } from '@/utils/ui';

type PayloadSchemaDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const PayloadSchemaDrawer = forwardRef<HTMLDivElement, PayloadSchemaDrawerProps>((props, ref) => {
  const { open, onOpenChange } = props;

  // For now, the save button doesn't do anything
  const handleSaveChanges = () => {
    // TODO: Implement save logic
    onOpenChange(false);
  };

  return (
    <Sheet modal={false} open={open} onOpenChange={onOpenChange}>
      {/* Custom overlay since SheetOverlay does not work with modal={false} */}
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
          {/* Content will go here */}
          <p className="text-center text-neutral-500">Payload schema management will be available here.</p>
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
