import {
  showSavingToast as showSaving,
  showWorkflowSuccessToast as showSuccess,
  showWorkflowErrorToast as showError,
} from '@/components/primitives/sonner-helpers';

// Re-export the functions with the same names to maintain compatibility
export const showSavingToast = showSaving;
export const showSuccessToast = showSuccess;
export const showErrorToast = showError;
