"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Pencil, Pin, X } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/formatters';

interface Expense {
  id: number;
  name: string;
  amount: number;
  date: string;
  month: number;
}

interface FixedExpenseOverride {
  id: number;
  fixed_expense_id: number;
  month: number;
  override_amount: number;
  date: string;
}

interface FixedExpense {
  id: number;
  name: string;
  amount: number;
  applicable_months: number[];
  overrides?: FixedExpenseOverride[];
}

interface MonthlyExpenseSectionProps {
  monthNumber: number;
  monthName: string;
  monthlyIncome: number;
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  onAddExpense: (monthNumber: number, expense: { name: string; amount: number }) => void;
  onDeleteExpense: (monthNumber: number, id: number) => void;
  onUnapplyFixedExpense: (fixedExpenseId: number, monthNumber: number) => void;
  onOverrideFixedExpense: (fixedExpenseId: number, month: number, overrideAmount: number) => void;
  onRevertOverride: (overrideId: number) => void;
}

const MonthlyExpenseSection: React.FC<MonthlyExpenseSectionProps> = ({
  monthNumber,
  monthlyIncome,
  expenses,
  fixedExpenses,
  onAddExpense,
  onDeleteExpense,
  onUnapplyFixedExpense,
  onOverrideFixedExpense,
  onRevertOverride,
}) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');

  // Calculate total including fixed expenses with overrides
  const regularExpensesTotal = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  const fixedExpensesTotal = fixedExpenses.reduce((acc, expense) => {
    const override = expense.overrides?.find(o => o.month === monthNumber);
    return acc + (override ? override.override_amount : expense.amount);
  }, 0);
  const totalExpenses = regularExpensesTotal + fixedExpensesTotal;
  const remainingBalance = monthlyIncome - totalExpenses;

  const handleAddExpense = () => {
    if (name.trim() && cost && !isNaN(parseFloat(cost))) {
      onAddExpense(monthNumber, { name: name.trim(), amount: parseFloat(cost) });
      setName('');
      setCost('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddExpense();
    }
  };

  return (
    <CardContent className="space-y-4">
      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label htmlFor={`name-${monthNumber}`}>Expense Name</Label>
          <Input
            id={`name-${monthNumber}`}
            type="text"
            placeholder="e.g., Groceries"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <div>
          <Label htmlFor={`cost-${monthNumber}`}>Cost (₹)</Label>
          <Input
            id={`cost-${monthNumber}`}
            type="number"
            placeholder="e.g., 2500"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={handleAddExpense} className="w-full">
            Add Expense
          </Button>
        </div>
      </div>

      {/* Expense List */}
      {(expenses.length > 0 || fixedExpenses.length > 0) ? (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-700">Expenses:</h4>
          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
            {/* Fixed Expenses */}
            {fixedExpenses.map((expense) => {
              const override = expense.overrides?.find(o => o.month === monthNumber);
              const displayAmount = override ? override.override_amount : expense.amount;
              const isEditing = editingExpenseId === expense.id;
              
              return (
                <Card key={`fixed-${expense.id}`} className="p-2 bg-blue-50 border-l-4 border-blue-500">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Pin className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{expense.name}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Fixed
                        </span>
                        {override && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            Modified
                          </span>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600">
                            Original: <span className="line-through">{formatCurrency(expense.amount)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="h-8 w-32"
                              placeholder="New amount"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                const amount = parseFloat(editAmount);
                                if (!isNaN(amount)) {
                                  onOverrideFixedExpense(expense.id, monthNumber, amount);
                                  setEditingExpenseId(null);
                                  setEditAmount('');
                                }
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingExpenseId(null);
                                setEditAmount('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            {override && (
                              <span className="text-xs text-gray-500 line-through">
                                Original: {formatCurrency(expense.amount)}
                              </span>
                            )}
                            <span className="text-xs text-gray-600">
                              {override ? 'Modified amount' : 'Recurring expense'}
                            </span>
                          </div>
                          <span className={`font-semibold ${override ? 'text-orange-900' : 'text-blue-900'}`}>
                            {formatCurrency(displayAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {!isEditing && (
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                          onClick={() => {
                            setEditingExpenseId(expense.id);
                            setEditAmount(displayAmount.toString());
                          }}
                          title={override ? "Edit override amount" : "Override for this month"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {override ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onRevertOverride(override.id)}
                            title="Revert to original amount"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => onUnapplyFixedExpense(expense.id, monthNumber)}
                            title="Remove from this month only"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}

            {/* Regular Expenses */}
            {expenses.map((expense) => (
              <Card key={expense.id} className="p-2 bg-white border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{expense.name}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDateTime(expense.date)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDeleteExpense(monthNumber, expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No expenses added yet.</p>
      )}

      {/* Summary */}
      <div className="pt-3 border-t border-gray-200">
        {fixedExpenses.length > 0 && (
          <div className="flex justify-between items-center text-sm text-blue-700 mb-1">
            <span className="font-medium">Fixed Expenses:</span>
            <span className="font-semibold">{formatCurrency(fixedExpensesTotal)}</span>
          </div>
        )}
        {expenses.length > 0 && (
          <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
            <span className="font-medium">Other Expenses:</span>
            <span className="font-semibold">{formatCurrency(regularExpensesTotal)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="font-semibold text-gray-700">Total Spent:</span>
          <span className="font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="font-semibold text-gray-700">Remaining:</span>
          <span className={`font-bold ${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(remainingBalance)}
          </span>
        </div>
      </div>
    </CardContent>
  );
};

export default MonthlyExpenseSection;
