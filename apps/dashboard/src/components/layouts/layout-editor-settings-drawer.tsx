import { forwardRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RiDeleteBin2Line } from 'react-icons/ri';
import { ExternalToast } from 'sonner';

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRoot,
} from '@/components/primitives/form/form';
import { Input } from '@/components/primitives/input';
import { showErrorToast, showSuccessToast } from '@/components/primitives/sonner-helpers';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { useLayoutEditor } from './layout-editor-provider';
import { useLayoutsNavigate } from './hooks/use-layouts-navigate';
import { useUpdateLayout } from '@/hooks/use-update-layout';
import { useDeleteLayout } from '@/hooks/use-delete-layout';
import { cn } from '@/utils/ui';

const LayoutSettingsFormSchema = z.object({
  name: z.string().min(1, 'Layout name is required'),
});

type LayoutSettingsFormData = z.infer<typeof LayoutSettingsFormSchema>;

const toastOptions: ExternalToast = {
  position: 'bottom-right',
  classNames: {
    toast: 'mb-4 right-0 pointer-events-none',
  },
};

type LayoutEditorSettingsDrawerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const LayoutEditorSettingsDrawer = forwardRef<HTMLDivElement, LayoutEditorSettingsDrawerProps>(
  ({ isOpen, onOpenChange }, forwardedRef) => {
    const { layout } = useLayoutEditor();
    const { navigateToLayoutsPage } = useLayoutsNavigate();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const { updateLayout, isPending: isUpdating } = useUpdateLayout({
      onSuccess: () => {
        showSuccessToast('Layout updated successfully', '', toastOptions);
        onOpenChange(false);
      },
      onError: () => {
        showErrorToast('Failed to update layout', 'Please try again later.', toastOptions);
      },
    });

    const { deleteLayout, isPending: isDeleting } = useDeleteLayout({
      onSuccess: () => {
        showSuccessToast('Layout deleted successfully', '', toastOptions);
        navigateToLayoutsPage();
        setIsDeleteModalOpen(false);
      },
      onError: () => {
        showErrorToast('Failed to delete layout', 'Please try again later.', toastOptions);
        setIsDeleteModalOpen(false);
      },
    });

    const form = useForm<LayoutSettingsFormData>({
      resolver: zodResolver(LayoutSettingsFormSchema),
      defaultValues: {
        name: layout?.name || '',
      },
      values: {
        name: layout?.name || '',
      },
    });

    const onSubmit = async (data: LayoutSettingsFormData) => {
      if (!layout) return;

      await updateLayout({
        layout: {
          name: data.name,
          controlValues: layout.controls.values || {},
        },
        layoutSlug: layout.slug,
      });
    };

    const handleDeleteLayout = async () => {
      if (!layout) return;

      await deleteLayout({
        layoutSlug: layout.slug,
      });
    };

    if (!layout) {
      return null;
    }

    return (
      <>
        <Sheet modal={false} open={isOpen} onOpenChange={onOpenChange}>
          {/* Custom overlay since SheetOverlay does not work with modal={false} */}
          <div
            className={cn('fade-in animate-in fixed inset-0 z-50 bg-black/20 transition-opacity duration-300', {
              'pointer-events-none opacity-0': !isOpen,
            })}
          />
          <SheetContent ref={forwardedRef} className="w-[480px]">
            <SheetHeader>
              <SheetTitle>Layout settings</SheetTitle>
              <SheetDescription>
                Update your layout name and identifier. Changes will be reflected across all workflows using this layout.
              </SheetDescription>
            </SheetHeader>

            <SheetMain>
              <Form {...form}>
                <FormRoot onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Layout name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter layout name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Layout identifier
                    </label>
                    <Input value={layout?.layoutId || ''} disabled />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="primary"
                      mode="ghost"
                      leadingIcon={RiDeleteBin2Line}
                      onClick={() => setIsDeleteModalOpen(true)}
                    >
                      Delete layout
                    </Button>
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={!form.formState.isDirty}
                      isLoading={isUpdating}
                    >
                      Save changes
                    </Button>
                  </div>
                </FormRoot>
              </Form>
            </SheetMain>
          </SheetContent>
        </Sheet>

        <ConfirmationModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleDeleteLayout}
          title="Delete layout"
          description={
            <span>
              Are you sure you want to delete layout <span className="font-bold">{layout.name}</span>? This action
              cannot be undone.
            </span>
          }
          confirmButtonText="Delete layout"
          isLoading={isDeleting}
        />
      </>
    );
  }
);

LayoutEditorSettingsDrawer.displayName = 'LayoutEditorSettingsDrawer';
