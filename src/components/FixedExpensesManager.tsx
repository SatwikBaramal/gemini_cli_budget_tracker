"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus } from 'lucide-react';
import { formatCurrency, getMonthName } from '@/lib/formatters';

interface FixedExpense {
  id: number;
  name: string;
  amount: number;
  applicable_months: number[];
}

interface FixedExpensesManagerProps {
  fixedExpenses: FixedExpense[];
  onAdd: (expense: { name: string; amount: number; applicable_months: number[] }) => void;
  onUpdate: (id: number, expense: { name: string; amount: number; applicable_months: number[] }) => void;
  onDelete: (id: number) => void;
  expenseToEdit: FixedExpense | null;
  onEditComplete: () => void;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const FixedExpensesManager: React.FC<FixedExpensesManagerProps> = ({
  fixedExpenses,
  onAdd,
  onUpdate,
  onDelete,
  expenseToEdit,
  onEditComplete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);

  // Watch for external edit requests
  React.useEffect(() => {
    if (expenseToEdit) {
      handleOpenDialog(expenseToEdit);
      setIsExpanded(true);
      onEditComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseToEdit]);

  const handleOpenDialog = (expense?: FixedExpense) => {
    if (expense) {
      setEditingId(expense.id);
      setName(expense.name);
      setAmount(expense.amount.toString());
      setSelectedMonths(expense.applicable_months);
    } else {
      setEditingId(null);
      setName('');
      setAmount('');
      setSelectedMonths([]);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setName('');
    setAmount('');
    setSelectedMonths([]);
  };

  const toggleMonth = (month: number) => {
    setSelectedMonths(prev =>
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  };

  const handleSave = () => {
    if (!name.trim() || !amount || selectedMonths.length === 0) {
      return;
    }

    const expenseData = {
      name: name.trim(),
      amount: parseFloat(amount),
      applicable_months: selectedMonths,
    };

    if (editingId) {
      onUpdate(editingId, expenseData);
    } else {
      onAdd(expenseData);
    }

    handleCloseDialog();
  };

  const getMonthsText = (months: number[]) => {
    if (months.length === 12) return 'All months';
    if (months.length === 0) return 'No months';
    if (months.length <= 3) {
      return months.map(m => getMonthName(m).substring(0, 3)).join(', ');
    }
    return `${months.length} months`;
  };

  return (
    <Card className="mb-6">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Manage Fixed Expenses</CardTitle>
          <div className="flex items-center gap-2">
            {!isExpanded && (
              <span className="text-sm text-gray-500">
                {fixedExpenses.length} fixed {fixedExpenses.length === 1 ? 'expense' : 'expenses'}
              </span>
            )}
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Add recurring expenses that automatically appear in selected months
            </p>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Fixed Expense
            </Button>
          </div>

          {/* List of Fixed Expenses */}
          {fixedExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No fixed expenses yet. Add one to get started!
            </div>
          ) : (
            <div className="space-y-2">
              {fixedExpenses.map((expense) => (
                <Card key={expense.id} className="p-4 border-l-4 border-purple-500 bg-purple-50/30">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{expense.name}</span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          Fixed
                        </span>
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        <span>{formatCurrency(expense.amount)}</span>
                        <span>• {getMonthsText(expense.applicable_months)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(expense)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(expense.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Add/Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Fixed Expense' : 'Add Fixed Expense'}
                </DialogTitle>
                <DialogDescription>
                  Fixed expenses will automatically appear in all selected months.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="expense-name">Expense Name</Label>
                  <Input
                    id="expense-name"
                    placeholder="e.g., Rent, Groceries, WiFi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="expense-amount">Amount (₹)</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    placeholder="e.g., 15000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Apply to Months</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {MONTHS.map((month) => (
                      <button
                        key={month}
                        type="button"
                        onClick={() => toggleMonth(month)}
                        className={`
                          px-3 py-2 text-sm rounded-md border transition-colors
                          ${selectedMonths.includes(month)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {getMonthName(month).substring(0, 3)}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonths(MONTHS)}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonths([])}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!name.trim() || !amount || selectedMonths.length === 0}
                >
                  {editingId ? 'Update' : 'Add'} Expense
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      )}
    </Card>
  );
};

export default FixedExpensesManager;

