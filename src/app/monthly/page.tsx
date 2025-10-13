"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import MonthlyExpenseSection from '@/components/MonthlyExpenseSection';
import FixedExpensesManager from '@/components/FixedExpensesManager';
import MonthNavigationGrid from '@/components/MonthNavigationGrid';
import BudgetProgressBar from '@/components/BudgetProgressBar';
import { getMonthName, formatCurrency } from '@/lib/formatters';
import { Pencil } from 'lucide-react';

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  month: number;
  type: string;
}

interface FixedExpenseOverride {
  id: string;
  fixed_expense_id: string;
  month: number;
  override_amount: number;
  date: string;
}

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  applicable_months: number[];
  overrides?: FixedExpenseOverride[];
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function Monthly() {
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [expensesByMonth, setExpensesByMonth] = useState<{ [key: number]: Expense[] }>({});
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [expenseToEdit, setExpenseToEdit] = useState<FixedExpense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // Current month (1-12)
  const [viewMode, setViewMode] = useState<'current' | 'all'>('current');

  useEffect(() => {
    const fetchData = async () => {
      // Fetch monthly income
      const incomeRes = await fetch('/api/income/monthly');
      const incomeData = await incomeRes.json();
      setMonthlyIncome(Number(incomeData.value));

      // Fetch all monthly expenses
      const expensesRes = await fetch('/api/expenses/monthly');
      const allExpenses: Expense[] = await expensesRes.json();

      // Group expenses by month
      const grouped: { [key: number]: Expense[] } = {};
      MONTHS.forEach(month => {
        grouped[month] = allExpenses.filter(exp => exp.month === month);
      });
      setExpensesByMonth(grouped);

      // Fetch fixed expenses
      const fixedRes = await fetch('/api/fixed-expenses');
      const fixedData: FixedExpense[] = await fixedRes.json();
      setFixedExpenses(fixedData);
    };
    fetchData();
  }, []);

  const addExpense = async (monthNumber: number, expense: { name: string; amount: number }) => {
    const response = await fetch(`/api/expenses/monthly/${monthNumber}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });
    const newExpense = await response.json();
    
    setExpensesByMonth(prev => ({
      ...prev,
      [monthNumber]: [...(prev[monthNumber] || []), newExpense],
    }));
  };

  const deleteExpense = async (monthNumber: number, id: string) => {
    await fetch(`/api/expenses/monthly/${monthNumber}/${id}`, {
      method: 'DELETE',
    });
    
    setExpensesByMonth(prev => ({
      ...prev,
      [monthNumber]: (prev[monthNumber] || []).filter(expense => expense.id !== id),
    }));
  };

  const getTotalSpentForMonth = (monthNumber: number): number => {
    const expenses = expensesByMonth[monthNumber] || [];
    const regularTotal = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    
    const applicableFixed = fixedExpenses.filter(fe => fe.applicable_months.includes(monthNumber));
    const fixedTotal = applicableFixed.reduce((acc, exp) => {
      const override = exp.overrides?.find(o => o.month === monthNumber);
      return acc + (override ? override.override_amount : exp.amount);
    }, 0);
    
    return regularTotal + fixedTotal;
  };

  const getFixedExpensesForMonth = (monthNumber: number): FixedExpense[] => {
    return fixedExpenses.filter(fe => fe.applicable_months.includes(monthNumber));
  };

  const handleEditIncome = () => {
    setIncomeInput(monthlyIncome.toString());
    setIsDialogOpen(true);
  };

  const handleSaveIncome = async () => {
    const newIncome = parseFloat(incomeInput);
    if (!isNaN(newIncome) && newIncome >= 0) {
      await fetch('/api/income/monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ income: newIncome }),
      });
      setMonthlyIncome(newIncome);
      setIsDialogOpen(false);
    }
  };

  // Fixed Expenses Handlers
  const handleAddFixedExpense = async (expense: { name: string; amount: number; applicable_months: number[] }) => {
    const response = await fetch('/api/fixed-expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });
    const newFixedExpense = await response.json();
    setFixedExpenses([...fixedExpenses, newFixedExpense]);
  };

  const handleUpdateFixedExpense = async (id: string, expense: { name: string; amount: number; applicable_months: number[] }) => {
    const response = await fetch(`/api/fixed-expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });
    const updatedExpense = await response.json();
    setFixedExpenses(fixedExpenses.map(fe => fe.id === id ? updatedExpense : fe));
  };

  const handleDeleteFixedExpense = async (id: string) => {
    await fetch(`/api/fixed-expenses/${id}`, {
      method: 'DELETE',
    });
    setFixedExpenses(fixedExpenses.filter(fe => fe.id !== id));
  };

  const handleUnapplyFixedExpense = async (fixedExpenseId: string, monthNumber: number) => {
    const fixedExpense = fixedExpenses.find(fe => fe.id === fixedExpenseId);
    if (!fixedExpense) return;

    const updatedMonths = fixedExpense.applicable_months.filter(m => m !== monthNumber);
    if (updatedMonths.length > 0) {
      await handleUpdateFixedExpense(fixedExpenseId, {
        name: fixedExpense.name,
        amount: fixedExpense.amount,
        applicable_months: updatedMonths,
      });
    } else {
      // If no months left, delete the fixed expense
      await handleDeleteFixedExpense(fixedExpenseId);
    }
  };

  // Override Handlers
  const handleOverrideFixedExpense = async (fixedExpenseId: string, month: number, overrideAmount: number) => {
    const response = await fetch('/api/fixed-expenses/overrides', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fixed_expense_id: fixedExpenseId,
        month,
        override_amount: overrideAmount,
      }),
    });
    const newOverride = await response.json();
    
    // Update the local state to include the new override
    setFixedExpenses(fixedExpenses.map(fe => {
      if (fe.id === fixedExpenseId) {
        const existingOverrides = fe.overrides || [];
        const filteredOverrides = existingOverrides.filter(o => o.month !== month);
        return {
          ...fe,
          overrides: [...filteredOverrides, newOverride],
        };
      }
      return fe;
    }));
  };

  const handleRevertOverride = async (overrideId: string) => {
    await fetch(`/api/fixed-expenses/overrides/${overrideId}`, {
      method: 'DELETE',
    });
    
    // Remove the override from local state
    setFixedExpenses(fixedExpenses.map(fe => ({
      ...fe,
      overrides: (fe.overrides || []).filter(o => o.id !== overrideId),
    })));
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto p-4">
        {/* Header Section */}
        <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monthly Expense Tracker</h2>
            <p className="text-sm text-gray-600 mt-1">
              Track expenses for each month separately
            </p>
          </div>
              <Link href="/">
                <Button>Track Yearly</Button>
              </Link>
            </div>

        {/* Income Display */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-700">Monthly Income:</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-green-600">{formatCurrency(monthlyIncome)}</span>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditIncome}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Monthly Income</DialogTitle>
                    <DialogDescription>
                      Update your monthly income amount. This will affect all month calculations.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="income">Monthly Income (₹)</Label>
                      <Input
                        id="income"
                        type="number"
                        placeholder="e.g., 40000"
                        value={incomeInput}
                        onChange={(e) => setIncomeInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveIncome()}
            />
          </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveIncome}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Conditional Rendering based on View Mode */}
        {viewMode === 'current' ? (
          <>
            {/* Current Month Expenses - Prominent Display */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {getMonthName(selectedMonth)} Expenses
                </h2>
                <div className="text-sm text-gray-600">
                  Spent: <span className="font-semibold text-red-600">{formatCurrency(getTotalSpentForMonth(selectedMonth))}</span>
                  {' | '}
                  Remaining: <span className={`font-semibold ${(monthlyIncome - getTotalSpentForMonth(selectedMonth)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(monthlyIncome - getTotalSpentForMonth(selectedMonth))}
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <BudgetProgressBar
                  income={monthlyIncome}
                  spent={getTotalSpentForMonth(selectedMonth)}
                />
              </div>
              
              <MonthlyExpenseSection
                monthNumber={selectedMonth}
                monthName={getMonthName(selectedMonth)}
                monthlyIncome={monthlyIncome}
                expenses={expensesByMonth[selectedMonth] || []}
                fixedExpenses={getFixedExpensesForMonth(selectedMonth)}
                onAddExpense={addExpense}
                onDeleteExpense={deleteExpense}
                onUnapplyFixedExpense={handleUnapplyFixedExpense}
                onOverrideFixedExpense={handleOverrideFixedExpense}
                onRevertOverride={handleRevertOverride}
              />
            </div>

            {/* Fixed Expenses Manager */}
            <div id="fixed-expenses-manager">
              <FixedExpensesManager
                fixedExpenses={fixedExpenses}
                onAdd={handleAddFixedExpense}
                onUpdate={handleUpdateFixedExpense}
                onDelete={handleDeleteFixedExpense}
                expenseToEdit={expenseToEdit}
                onEditComplete={() => setExpenseToEdit(null)}
              />
            </div>

            {/* Month Navigation Grid */}
            <MonthNavigationGrid
              months={MONTHS}
              selectedMonth={selectedMonth}
              onMonthSelect={setSelectedMonth}
              getMonthData={(month) => ({
                name: getMonthName(month),
                spent: getTotalSpentForMonth(month),
                remaining: monthlyIncome - getTotalSpentForMonth(month)
              })}
            />

            {/* Toggle Button to All Months View */}
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => setViewMode('all')}
              >
                View All Months (Accordion)
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* All Months View */}
            <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-lg shadow">
              <h2 className="text-xl font-bold">All Months</h2>
              <Button onClick={() => setViewMode('current')}>
                Back to Current Month View
              </Button>
            </div>

            {/* Fixed Expenses Manager */}
            <div id="fixed-expenses-manager">
              <FixedExpensesManager
                fixedExpenses={fixedExpenses}
                onAdd={handleAddFixedExpense}
                onUpdate={handleUpdateFixedExpense}
                onDelete={handleDeleteFixedExpense}
                expenseToEdit={expenseToEdit}
                onEditComplete={() => setExpenseToEdit(null)}
              />
            </div>

            {/* Monthly Accordions */}
            <div className="bg-white rounded-lg shadow">
              <Accordion type="single" collapsible className="w-full">
                {MONTHS.map((monthNumber) => {
                  const monthName = getMonthName(monthNumber);
                  const expenses = expensesByMonth[monthNumber] || [];
                  const totalSpent = getTotalSpentForMonth(monthNumber);
                  const remaining = monthlyIncome - totalSpent;

                  return (
                    <AccordionItem key={monthNumber} value={`month-${monthNumber}`}>
                      <AccordionTrigger className="px-6 hover:bg-gray-50">
                        <div className="flex justify-between items-center w-full pr-4">
                          <span className="font-semibold text-lg">{monthName}</span>
                          <div className="flex gap-4 text-sm">
                            <span className="text-gray-600">
                              Spent: <span className="font-semibold text-red-600">{formatCurrency(totalSpent)}</span>
                            </span>
                            <span className="text-gray-600">
                              Remaining: <span className={`font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(remaining)}</span>
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <MonthlyExpenseSection
                          monthNumber={monthNumber}
                          monthName={monthName}
                          monthlyIncome={monthlyIncome}
                          expenses={expenses}
                          fixedExpenses={getFixedExpensesForMonth(monthNumber)}
                          onAddExpense={addExpense}
                          onDeleteExpense={deleteExpense}
                          onUnapplyFixedExpense={handleUnapplyFixedExpense}
                          onOverrideFixedExpense={handleOverrideFixedExpense}
                          onRevertOverride={handleRevertOverride}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
