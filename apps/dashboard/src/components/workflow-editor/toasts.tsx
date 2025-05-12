import {
  showSavingToast as showSaving,
  showWorkflowSuccessToast as showSuccess,
  showWorkflowErrorToast as showError,
} from '@/components/primitives/sonner-helpers';

// Re-export the functions with the same names to maintain compatibility
export const showSavingToast = showSaving;
export const showSuccessToast = showSuccess;
export const showErrorToast = showError;

import { showToast } from '@/components/primitives/sonner-helpers';
import { ToastIcon } from '@/components/primitives/sonner';

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
export const showSuccessToast = (toastId: string | number) => {
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
export const showErrorToast = (toastId: string | number, error?: any) => {
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
