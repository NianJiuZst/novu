import { ReactNode } from 'react';
import { ExternalToast, toast } from 'sonner';
import { Toast, ToastIcon, ToastProps } from './sonner';

export const showToast = ({
  options,
  children,
  ...toastProps
}: Omit<ToastProps, 'children'> & {
  options: ExternalToast;
  children: (args: { close: () => void }) => ReactNode;
}) => {
  return toast.custom((id) => <Toast {...toastProps}>{children({ close: () => toast.dismiss(id) })}</Toast>, {
    duration: 5000,
    unstyled: true,
    closeButton: false,
    ...options,
  });
};

export const showSuccessToast = (message: string, title?: string, options: ExternalToast = {}) => {
  showToast({
    title,
    children: () => (
      <>
        <ToastIcon variant="success" />
        <span className="text-sm">{message}</span>
      </>
    ),
    options: {
      position: 'bottom-center',
      ...options,
    },
  });
};

export const showErrorToast = (message: string, title?: string, options: ExternalToast = {}) => {
  showToast({
    title,
    children: () => (
      <>
        <ToastIcon variant="error" />
        <span className="text-sm">{message}</span>
      </>
    ),
    options: {
      position: 'bottom-center',
      ...options,
    },
  });
};

// Added for workflow editor toasts
export const showSavingToast = (setToastId: (toastId: string | number) => void) => {
  setToastId(
    showToast({
      children: () => (
        <>
          <ToastIcon variant="default" />
          <span className="text-sm">Saving</span>
        </>
      ),
      options: {
        position: 'bottom-right',
        classNames: {
          toast: 'right-0',
        },
      },
    })
  );
};

// Workflow-specific success toast with ID
export const showWorkflowSuccessToast = (toastId: string | number) => {
  showToast({
    children: () => (
      <>
        <ToastIcon variant="success" />
        <span className="text-sm">Saved</span>
      </>
    ),
    options: {
      position: 'bottom-right',
      classNames: {
        toast: 'right-0',
      },
      id: toastId,
    },
  });
};

// Workflow-specific error toast with ID and custom error handling
export const showWorkflowErrorToast = (toastId: string | number, error?: any) => {
  const message = getWorkflowErrorMessage(error);

  showToast({
    children: () => (
      <>
        <ToastIcon variant="error" />
        <span className="text-sm">{message}</span>
      </>
    ),
    options: {
      position: 'bottom-right',
      classNames: {
        toast: 'right-0',
      },
      id: toastId,
    },
  });
};

// Helper function for workflow error messages
const DETAILED_ERROR_MESSAGES = ['Workflow steps limit exceeded', 'Workflow limit exceeded'] as const;

function getWorkflowErrorMessage(error?: any): string {
  if (!error?.message) return 'Failed to save';

  return DETAILED_ERROR_MESSAGES.some((message) => error.message.includes(message)) ? error.message : 'Failed to save';
}
