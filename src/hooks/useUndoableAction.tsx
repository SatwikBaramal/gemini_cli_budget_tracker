import { useRef } from 'react';
import { toast as sonnerToast } from 'sonner';

interface UndoableActionOptions<T> {
  action: () => Promise<void>;
  undo: (data: T) => Promise<void>;
  message?: string;
  undoMessage?: string;
}

export function useUndoableAction<T>() {
  const undoDataRef = useRef<T | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const executeWithUndo = async (
    data: T,
    { action, undo, message = 'Action completed', undoMessage = 'Undone' }: UndoableActionOptions<T>
  ) => {
    // Store the data for potential undo
    undoDataRef.current = data;

    // Execute the action
    await action();

    // Clear any existing timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Show toast with undo option
    let toastDismissed = false;

    sonnerToast.success(message, {
      action: {
        label: 'Undo',
        onClick: async () => {
          toastDismissed = true;
          if (undoDataRef.current) {
            await undo(undoDataRef.current);
            sonnerToast.success(undoMessage);
            undoDataRef.current = null;
          }
        },
      },
      duration: 5000,
    });

    // Clear undo data after 5 seconds if not undone
    undoTimeoutRef.current = setTimeout(() => {
      if (!toastDismissed) {
        undoDataRef.current = null;
      }
    }, 5000);
  };

  return { executeWithUndo };
}

