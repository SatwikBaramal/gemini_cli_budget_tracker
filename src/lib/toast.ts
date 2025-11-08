import { toast as sonnerToast } from 'sonner';

/**
 * Toast notification utilities
 * Wrapper around sonner for consistent toast notifications
 */

export const toast = {
  success: (message: string, description?: string) => {
    if (description) {
      sonnerToast.success(message, { description });
    } else {
      sonnerToast.success(message);
    }
  },

  error: (message: string, description?: string) => {
    if (description) {
      sonnerToast.error(message, { description });
    } else {
      sonnerToast.error(message);
    }
  },

  info: (message: string, description?: string) => {
    if (description) {
      sonnerToast.info(message, { description });
    } else {
      sonnerToast.info(message);
    }
  },

  warning: (message: string, description?: string) => {
    if (description) {
      sonnerToast.warning(message, { description });
    } else {
      sonnerToast.warning(message);
    }
  },

  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};












