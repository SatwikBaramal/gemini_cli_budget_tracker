'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  onConfirmDelete,
}: DeleteAccountDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete();
      // Dialog will be closed by parent component after successful deletion
    } catch (error) {
      console.error('Error deleting account:', error);
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <DialogTitle className="text-xl text-red-600 dark:text-red-400">
              Delete Account
            </DialogTitle>
          </div>
          <DialogDescription className="text-base pt-4 space-y-4">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
                Warning: This action cannot be undone!
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              All your financial data will be <strong>permanently deleted</strong>. 
              This action cannot be undone and <strong>there is no backup</strong>.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
                The following data will be permanently deleted:
              </p>
              <ul className="text-sm text-red-800 dark:text-red-300 space-y-1 list-disc list-inside">
                <li>All expenses (monthly and yearly)</li>
                <li>All fixed/recurring expenses</li>
                <li>All savings goals and contributions</li>
                <li>All income settings and overrides</li>
                <li>All saved filter presets</li>
                <li>Your account information</li>
              </ul>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              If you want to keep your data, please export it before proceeding with deletion.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

