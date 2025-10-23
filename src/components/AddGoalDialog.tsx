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

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (goalData: GoalFormData) => Promise<void>;
  editGoal?: {
    _id: string;
    name: string;
    targetAmount: number;
    deadline: string;
    monthlySavingsTarget?: number;
  } | null;
}

export interface GoalFormData {
  name: string;
  targetAmount: number;
  deadline: string;
  monthlySavingsTarget?: number;
}

export const AddGoalDialog: React.FC<AddGoalDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  editGoal,
}) => {
  const [formData, setFormData] = useState<GoalFormData>({
    name: '',
    targetAmount: 0,
    deadline: '',
    monthlySavingsTarget: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editGoal) {
      setFormData({
        name: editGoal.name,
        targetAmount: editGoal.targetAmount,
        deadline: editGoal.deadline.split('T')[0], // Format for date input
        monthlySavingsTarget: editGoal.monthlySavingsTarget,
      });
    } else {
      // Reset form for new goal
      setFormData({
        name: '',
        targetAmount: 0,
        deadline: '',
        monthlySavingsTarget: undefined,
      });
    }
    setErrors({});
  }, [editGoal, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required';
    }

    if (!formData.targetAmount || formData.targetAmount <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than 0';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate <= today) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    if (
      formData.monthlySavingsTarget !== undefined &&
      formData.monthlySavingsTarget < 0
    ) {
      newErrors.monthlySavingsTarget = 'Monthly savings target cannot be negative';
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
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof GoalFormData, value: string | number | undefined) => {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editGoal ? 'Edit Goal' : 'Create New Goal'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Goal Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Vacation to Goa"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Target Amount */}
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount (₹) *</Label>
              <Input
                id="targetAmount"
                type="number"
                placeholder="50000"
                min="1"
                step="1"
                value={formData.targetAmount || ''}
                onChange={(e) =>
                  handleChange('targetAmount', parseFloat(e.target.value) || 0)
                }
                className={errors.targetAmount ? 'border-red-500' : ''}
              />
              {errors.targetAmount && (
                <p className="text-sm text-red-500">{errors.targetAmount}</p>
              )}
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => handleChange('deadline', e.target.value)}
                className={errors.deadline ? 'border-red-500' : ''}
              />
              {errors.deadline && (
                <p className="text-sm text-red-500">{errors.deadline}</p>
              )}
            </div>

            {/* Monthly Savings Target (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="monthlySavingsTarget">
                Monthly Savings Target (₹) - Optional
              </Label>
              <Input
                id="monthlySavingsTarget"
                type="number"
                placeholder="5000"
                min="0"
                step="1"
                value={formData.monthlySavingsTarget || ''}
                onChange={(e) =>
                  handleChange(
                    'monthlySavingsTarget',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className={errors.monthlySavingsTarget ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500">
                This is informational only - you&apos;ll manually track your savings
              </p>
              {errors.monthlySavingsTarget && (
                <p className="text-sm text-red-500">
                  {errors.monthlySavingsTarget}
                </p>
              )}
            </div>
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
                ? 'Saving...'
                : editGoal
                ? 'Update Goal'
                : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

