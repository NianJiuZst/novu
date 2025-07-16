import { LayoutResponseDto } from '@novu/shared';
import { ConfirmationModal } from './confirmation-modal';
import TruncatedText from './truncated-text';

type DeleteLayoutDialogProps = {
  layout: LayoutResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export const DeleteLayoutDialog = ({
  layout,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteLayoutDialogProps) => {
  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Are you sure?"
      description={
        <>
          You're about to delete the <TruncatedText className="max-w-[32ch] font-bold">{layout.name}</TruncatedText>{' '}
          layout, this action is permanent. <br />
          <br />
          You won't be able to use this layout anymore.
        </>
      }
      confirmButtonText="Delete"
      isLoading={isLoading}
    />
  );
};