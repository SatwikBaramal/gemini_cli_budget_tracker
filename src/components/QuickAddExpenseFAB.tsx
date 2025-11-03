'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from '@/lib/toast';

interface QuickAddExpenseFABProps {
  onExpenseAdded?: () => void;
}

export const QuickAddExpenseFAB: React.FC<QuickAddExpenseFABProps> = ({ onExpenseAdded }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericAmount = parseFloat(amount);
    if (!name.trim() || !numericAmount || numericAmount <= 0) {
      toast.error('Please enter valid expense details');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const response = await fetch(`/api/expenses/monthly/${currentMonth}?year=${currentYear}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          amount: numericAmount,
          year: currentYear 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      toast.success(`Added ₹${numericAmount.toLocaleString('en-IN')} expense`);
      setName('');
      setAmount('');
      setOpen(false);
      
      if (onExpenseAdded) {
        onExpenseAdded();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Quick add expense"
        >
          <Plus className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[400px]">
        <SheetHeader>
          <SheetTitle>Quick Add Expense</SheetTitle>
          <SheetDescription>
            Add an expense for the current month ({new Date().toLocaleString('en-US', { month: 'long' })})
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="expense-name">Expense Name</Label>
            <Input
              id="expense-name"
              type="text"
              placeholder="e.g., Groceries, Rent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          
          <div>
            <Label htmlFor="expense-amount">Amount (₹)</Label>
            <Input
              id="expense-amount"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 500.00"
              value={amount}
              onChange={handleAmountChange}
              className="mt-1"
              disabled={isSubmitting}
            />
          </div>

          <SheetFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

