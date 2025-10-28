import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/formatters';

interface ManageSavingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalName: string;
  currentAmount: number;
  onSave: (transaction: TransactionData) => Promise<void>;
}

export interface TransactionData {
  amount: number;
  date: string;
  note?: string;
  type: 'addition' | 'withdrawal';
}

export const ManageSavingsDialog: React.FC<ManageSavingsDialogProps> = ({
  open,
  onOpenChange,
  goalName,
  currentAmount,
  onSave,
}) => {
  const [transactionType, setTransactionType] = useState<'addition' | 'withdrawal'>('addition');
  const [formData, setFormData] = useState<Omit<TransactionData, 'type'>>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTransactionType('addition');
      setFormData({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        note: '',
      });
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (transactionType === 'withdrawal' && formData.amount > currentAmount) {
      newErrors.amount = `Cannot withdraw more than available balance (${formatCurrency(currentAmount)})`;
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        type: transactionType,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Manage Savings - &quot;{goalName}&quot;</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Transaction Type Toggle */}
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={transactionType === 'addition' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTransactionType('addition')}
                >
                  Add Savings
                </Button>
                <Button
                  type="button"
                  variant={transactionType === 'withdrawal' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTransactionType('withdrawal')}
                >
                  Withdraw Savings
                </Button>
              </div>
            </div>

            {/* Available Balance (for withdrawals) */}
            {transactionType === 'withdrawal' && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Available to withdraw:</span>{' '}
                  {formatCurrency(currentAmount)}
                </p>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder={transactionType === 'addition' ? '5000' : '1000'}
                min="1"
                step="1"
                max={transactionType === 'withdrawal' ? currentAmount : undefined}
                value={formData.amount || ''}
                onChange={(e) =>
                  handleChange('amount', parseFloat(e.target.value) || 0)
                }
                className={errors.amount ? 'border-red-500' : ''}
                autoFocus
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={errors.date ? 'border-red-500' : ''}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            {/* Note (Only for additions) */}
            {transactionType === 'addition' && (
              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Input
                  id="note"
                  placeholder="e.g., Monthly savings"
                  value={formData.note}
                  onChange={(e) => handleChange('note', e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Processing...'
                : transactionType === 'addition'
                ? 'Add Savings'
                : 'Withdraw Savings'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


