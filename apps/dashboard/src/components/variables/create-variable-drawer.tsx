import { forwardRef, useId, useState } from 'react';
import { RiArrowRightSLine, RiCodeSSlashLine } from 'react-icons/ri';
import { Button } from '@/components/primitives/button';
import { Separator } from '@/components/primitives/separator';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetMain, SheetTitle } from '@/components/primitives/sheet';
import { useEnvironment } from '@/context/environment/hooks';
import { useCombinedRefs } from '@/hooks/use-combined-refs';
import { useFormProtection } from '@/hooks/use-form-protection';
import { useOnElementUnmount } from '@/hooks/use-on-element-unmount';
import { cn } from '@/utils/ui';
import { CreateVariableForm } from './create-variable-form';

type CreateVariableDrawerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const CreateVariableDrawer = forwardRef<HTMLDivElement, CreateVariableDrawerProps>((props, forwardedRef) => {
  const { isOpen, onOpenChange, onSuccess, onCancel } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formId = useId();
  const { environments = [] } = useEnvironment();

  const {
    protectedOnValueChange,
    ProtectionAlert,
    ref: protectionRef,
  } = useFormProtection({
    onValueChange: onOpenChange,
  });

  const { ref: unmountRef } = useOnElementUnmount({
    callback: () => {
      if (onCancel) onCancel();
    },
    condition: !isOpen,
  });

  const combinedRef = useCombinedRefs(forwardedRef, unmountRef, protectionRef);

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <>
      <Sheet modal={false} open={isOpen} onOpenChange={protectedOnValueChange}>
        <div
          className={cn('fade-in animate-in fixed inset-0 z-50 bg-black/20 transition-opacity duration-300', {
            'pointer-events-none opacity-0': !isOpen,
          })}
        />
        <SheetContent ref={combinedRef} className="w-[480px]">
          <SheetHeader className="px-3 py-1.5">
            <SheetTitle className="flex items-center gap-1.5">
              <RiCodeSSlashLine className="size-4" />
              Create variable
            </SheetTitle>
          </SheetHeader>
          <Separator />
          <SheetMain className="px-3 py-5">
            <CreateVariableForm
              formId={formId}
              environments={environments}
              onSuccess={handleSuccess}
              onError={() => setIsSubmitting(false)}
              onSubmitStart={() => setIsSubmitting(true)}
            />
          </SheetMain>
          <Separator />
          <SheetFooter className="justify-end p-3">
            <Button
              variant="secondary"
              size="xs"
              mode="gradient"
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              trailingIcon={RiArrowRightSLine}
              form={formId}
            >
              Create variable
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {ProtectionAlert}
    </>
  );
});

CreateVariableDrawer.displayName = 'CreateVariableDrawer';
