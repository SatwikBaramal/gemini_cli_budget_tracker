"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Pencil, X, DollarSign, Loader2 } from 'lucide-react';
import { getMonthName, formatCurrency } from '@/lib/formatters';
import { toast } from '@/lib/toast';

interface MonthlyIncomeOverride {
  id: string;
  month: number;
  year: number;
  override_amount: number;
  date: string;
}

interface MonthlyIncomeOverrideDialogProps {
  baseMonthlyIncome: number;
  year: number;
  overrides: MonthlyIncomeOverride[];
  onOverrideChange: (data?: MonthlyIncomeOverride[]) => Promise<void>;
  trigger?: React.ReactNode;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const MonthlyIncomeOverrideDialog: React.FC<MonthlyIncomeOverrideDialogProps> = ({
  baseMonthlyIncome,
  year,
  overrides,
  onOverrideChange,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Local copy of overrides for optimistic updates
  const [localOverrides, setLocalOverrides] = useState<MonthlyIncomeOverride[]>(overrides);

  // Sync local overrides with parent when they change
  useEffect(() => {
    setLocalOverrides(overrides);
  }, [overrides]);

  const getOverrideForMonth = (month: number): MonthlyIncomeOverride | undefined => {
    return localOverrides.find(o => o.month === month);
  };

  const handleEditMonth = (month: number) => {
    const override = getOverrideForMonth(month);
    setEditingMonth(month);
    setEditAmount(override ? override.override_amount.toString() : baseMonthlyIncome.toString());
  };

  const handleSaveOverride = async (month: number) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    setIsSubmitting(true);
    
    // Optimistic update - update local state immediately
    const existingOverride = localOverrides.find(o => o.month === month);
    const tempId = existingOverride?.id || `temp-${month}`;
    const optimisticOverride: MonthlyIncomeOverride = {
      id: tempId,
      month,
      year,
      override_amount: amount,
      date: new Date().toISOString(),
    };
    
    if (existingOverride) {
      setLocalOverrides(localOverrides.map(o => o.month === month ? optimisticOverride : o));
    } else {
      setLocalOverrides([...localOverrides, optimisticOverride]);
    }
    
    // Clear edit state immediately for better UX
    setEditingMonth(null);
    setEditAmount('');
    
    try {
      const response = await fetch('/api/income/monthly/overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month,
          override_amount: amount,
          year,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save override');
      }
      
      // Get updated data from API response
      const responseData = await response.json();
      if (responseData.success && responseData.data) {
        // Update local state with real data
        setLocalOverrides(responseData.data);
        // Pass data to parent (no additional API call needed)
        await onOverrideChange(responseData.data);
      }
    } catch (error) {
      console.error('Error saving override:', error);
      toast.error('Failed to save income override');
      // Revert optimistic update on error
      setLocalOverrides(overrides);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    setIsSubmitting(true);
    
    // Optimistic update - remove from local state immediately
    const previousOverrides = [...localOverrides];
    setLocalOverrides(localOverrides.filter(o => o.id !== overrideId));
    
    try {
      const response = await fetch(`/api/income/monthly/overrides/${overrideId}?year=${year}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete override');
      }
      
      // Get updated data from API response
      const responseData = await response.json();
      if (responseData.success && responseData.data) {
        // Update local state with real data
        setLocalOverrides(responseData.data);
        // Pass data to parent (no additional API call needed)
        await onOverrideChange(responseData.data);
      }
    } catch (error) {
      console.error('Error deleting override:', error);
      toast.error('Failed to delete income override');
      // Revert optimistic update on error
      setLocalOverrides(previousOverrides);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingMonth(null);
    setEditAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Customize Monthly Income
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] md:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Monthly Income for {year}</DialogTitle>
          <DialogDescription>
            Set different income amounts for specific months. Base monthly income: <strong>{formatCurrency(baseMonthlyIncome)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-50">
              <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg shadow-lg border">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Saving changes...</span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
            {MONTHS.map((month) => {
              const override = getOverrideForMonth(month);
              const isEditing = editingMonth === month;
              const displayAmount = override ? override.override_amount : baseMonthlyIncome;
              const hasOverride = !!override;

              return (
                <Card
                  key={month}
                  className={`p-4 ${
                    hasOverride ? 'bg-green-50 border-green-500 border-l-4' : 'bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{getMonthName(month)}</h4>
                        {hasOverride && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded inline-block mt-1">
                            Customized
                          </span>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        {hasOverride && (
                          <div className="text-xs text-gray-600">
                            Base: <span className="line-through">{formatCurrency(baseMonthlyIncome)}</span>
                          </div>
                        )}
                        <div>
                          <Label htmlFor={`income-${month}`} className="text-xs">
                            Income Amount (₹)
                          </Label>
                          <Input
                            id={`income-${month}`}
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="h-8 mt-1"
                            autoFocus
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveOverride(month)}
                          />
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleSaveOverride(month)}
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          {hasOverride ? (
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 line-through">
                                Base: {formatCurrency(baseMonthlyIncome)}
                              </span>
                              <span className="text-sm font-semibold text-green-700">
                                {formatCurrency(displayAmount)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-gray-700">
                              {formatCurrency(displayAmount)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMonth(month)}
                            disabled={isSubmitting}
                            className="flex-1 h-8"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            {hasOverride ? 'Edit' : 'Customize'}
                          </Button>
                          {hasOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteOverride(override.id)}
                              disabled={isSubmitting}
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">💡 Tip</h4>
            <p className="text-xs text-blue-800">
              Use this feature when you have irregular income, bonuses, or any month-specific changes to your regular income.
              For example, if you receive a bonus in November, you can increase that month&apos;s income accordingly.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyIncomeOverrideDialog;

