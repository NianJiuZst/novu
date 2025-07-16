import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LayoutResponseDto } from '@novu/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './primitives/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormInput,
  FormItem,
  FormLabel,
  FormMessage,
  FormRoot,
} from './primitives/form/form';
import { Button } from './primitives/button';
import TruncatedText from './truncated-text';

const duplicateLayoutSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

type DuplicateLayoutFormData = z.infer<typeof duplicateLayoutSchema>;

type DuplicateLayoutDialogProps = {
  layout: LayoutResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string }) => void;
  isLoading?: boolean;
};

export const DuplicateLayoutDialog = ({
  layout,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DuplicateLayoutDialogProps) => {
  const form = useForm<DuplicateLayoutFormData>({
    resolver: zodResolver(duplicateLayoutSchema),
    defaultValues: {
      name: `${layout.name} (Copy)`,
    },
  });

  const onSubmit = (data: DuplicateLayoutFormData) => {
    onConfirm(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplicate layout</DialogTitle>
          <DialogDescription>
            Create a copy of <TruncatedText className="max-w-[32ch] font-medium">{layout.name}</TruncatedText> layout.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <FormRoot
            id="duplicate-layout"
            autoComplete="off"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Layout name</FormLabel>
                  <FormControl>
                    <FormInput {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormRoot>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="duplicate-layout" isLoading={isLoading}>
            Duplicate layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};