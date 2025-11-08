"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MonthlyExpenseSection from '@/components/MonthlyExpenseSection';
import FixedExpensesManager from '@/components/FixedExpensesManager';
import MonthNavigationGrid from '@/components/MonthNavigationGrid';
import { CalendarView } from '@/components/CalendarView';
import BudgetProgressBar from '@/components/BudgetProgressBar';
import { getMonthName, formatCurrency } from '@/lib/formatters';
import { toast } from '@/lib/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { QuickAddExpenseFAB } from '@/components/QuickAddExpenseFAB';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useCallback } from 'react';

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

interface MonthlyIncomeOverride {
  id: string;
  month: number;
  year: number;
  override_amount: number;
  date: string;
}

interface Goal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: 'active' | 'completed' | 'archived';
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function Monthly() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [incomeOverrides, setIncomeOverrides] = useState<MonthlyIncomeOverride[]>([]);
  const [expensesByMonth, setExpensesByMonth] = useState<{ [key: number]: Expense[] }>({});
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expenseToEdit, setExpenseToEdit] = useState<FixedExpense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // Current month (1-12)
  const [viewMode, setViewMode] = useState<'current' | 'all'>('current');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch monthly income for the selected year
        const incomeRes = await fetch(`/api/income/monthly?year=${selectedYear}`);
        
        if (!incomeRes.ok) {
          throw new Error('Failed to fetch monthly income');
        }
        
        const incomeData = await incomeRes.json();
        setMonthlyIncome(Number(incomeData.value));

        // Fetch income overrides for the selected year
        const overridesRes = await fetch(`/api/income/monthly/overrides?year=${selectedYear}`);
        
        if (!overridesRes.ok) {
          throw new Error('Failed to fetch income overrides');
        }
        
        const overridesData: MonthlyIncomeOverride[] = await overridesRes.json();
        setIncomeOverrides(overridesData);

        // Fetch all monthly expenses for the selected year
        const expensesRes = await fetch(`/api/expenses/monthly?year=${selectedYear}`);
        
        if (!expensesRes.ok) {
          throw new Error('Failed to fetch expenses');
        }
        
        const allExpenses: Expense[] = await expensesRes.json();

        // Group expenses by month
        const grouped: { [key: number]: Expense[] } = {};
        MONTHS.forEach(month => {
          grouped[month] = allExpenses.filter(exp => exp.month === month);
        });
        setExpensesByMonth(grouped);

        // Fetch fixed expenses for the selected year
        const fixedRes = await fetch(`/api/fixed-expenses?year=${selectedYear}`);
        
        if (!fixedRes.ok) {
          throw new Error('Failed to fetch fixed expenses');
        }
        
        const fixedData: FixedExpense[] = await fixedRes.json();
        setFixedExpenses(fixedData);

        // Fetch goals
        const goalsRes = await fetch('/api/goals');
        
        if (goalsRes.ok) {
          const goalsData: Goal[] = await goalsRes.json();
          setGoals(goalsData);
        }
      } catch (err: unknown) {
        // Only show error if not aborted
        if (err instanceof Error && err.name !== 'AbortError') {
          const errorMessage = err.message || 'Failed to load data';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [selectedYear, fetchData]);

  const addExpense = async (monthNumber: number, expense: { name: string; amount: number }) => {
    const response = await fetch(`/api/expenses/monthly/${monthNumber}?year=${selectedYear}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...expense, year: selectedYear }),
    });
    const newExpense = await response.json();
    
    setExpensesByMonth(prev => ({
      ...prev,
      [monthNumber]: [...(prev[monthNumber] || []), newExpense],
    }));
  };

  const deleteExpense = async (monthNumber: number, id: string) => {
    await fetch(`/api/expenses/monthly/${monthNumber}/${id}?year=${selectedYear}`, {
      method: 'DELETE',
    });
    
    setExpensesByMonth(prev => ({
      ...prev,
      [monthNumber]: (prev[monthNumber] || []).filter(expense => expense.id !== id),
    }));
  };

  // Helper function to get income for a specific month (with override if exists)
  const getIncomeForMonth = (monthNumber: number): number => {
    const override = incomeOverrides.find(o => o.month === monthNumber);
    return override ? override.override_amount : monthlyIncome;
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

  // Fixed Expenses Handlers
  const handleAddFixedExpense = async (expense: { name: string; amount: number; applicable_months: number[] }) => {
    const response = await fetch('/api/fixed-expenses?year=${selectedYear}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...expense, year: selectedYear }),
    });
    const newFixedExpense = await response.json();
    setFixedExpenses([...fixedExpenses, newFixedExpense]);
  };

  const handleUpdateFixedExpense = async (id: string, expense: { name: string; amount: number; applicable_months: number[] }) => {
    const response = await fetch(`/api/fixed-expenses/${id}?year=${selectedYear}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...expense, year: selectedYear }),
    });
    const updatedExpense = await response.json();
    setFixedExpenses(fixedExpenses.map(fe => fe.id === id ? updatedExpense : fe));
  };

  const handleDeleteFixedExpense = async (id: string) => {
    await fetch(`/api/fixed-expenses/${id}?year=${selectedYear}`, {
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
    const response = await fetch('/api/fixed-expenses/overrides?year=${selectedYear}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fixed_expense_id: fixedExpenseId,
        month,
        override_amount: overrideAmount,
        year: selectedYear,
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
    await fetch(`/api/fixed-expenses/overrides/${overrideId}?year=${selectedYear}`, {
      method: 'DELETE',
    });
    
    // Remove the override from local state
    setFixedExpenses(fixedExpenses.map(fe => ({
      ...fe,
      overrides: (fe.overrides || []).filter(o => o.id !== overrideId),
    })));
  };


  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header selectedYear={selectedYear} onYearChange={setSelectedYear} />
      <div className="container mx-auto p-2 sm:p-4">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
              <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Data</h3>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              <Button 
                className="mt-4" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </div>
        ) : (
          <PullToRefresh onRefresh={fetchData}>
            <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-6 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Monthly Expense Tracker - {selectedYear}</h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track expenses for each month separately
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">Track Yearly</Button>
            </Link>
          </div>
        </div>

        {/* Conditional Rendering based on View Mode */}
        {viewMode === 'current' ? (
          <>
            {/* Current Month Expenses - Prominent Display */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-6 relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {getMonthName(selectedMonth)} Expenses
                </h2>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-2">
                  <span>
                    Spent: <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(getTotalSpentForMonth(selectedMonth))}</span>
                  </span>
                  <span className="hidden sm:inline">|</span>
                  <span>
                    Remaining: <span className={`font-semibold ${(getIncomeForMonth(selectedMonth) - getTotalSpentForMonth(selectedMonth)) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(getIncomeForMonth(selectedMonth) - getTotalSpentForMonth(selectedMonth))}
                    </span>
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <BudgetProgressBar
                  income={getIncomeForMonth(selectedMonth)}
                  spent={getTotalSpentForMonth(selectedMonth)}
                />
              </div>
              
              <MonthlyExpenseSection
                monthNumber={selectedMonth}
                monthName={getMonthName(selectedMonth)}
                monthlyIncome={getIncomeForMonth(selectedMonth)}
                expenses={expensesByMonth[selectedMonth] || []}
                fixedExpenses={getFixedExpensesForMonth(selectedMonth)}
                onAddExpense={addExpense}
                onDeleteExpense={deleteExpense}
                onUnapplyFixedExpense={handleUnapplyFixedExpense}
                onOverrideFixedExpense={handleOverrideFixedExpense}
                onRevertOverride={handleRevertOverride}
                baseMonthlyIncome={monthlyIncome}
                isIncomeOverridden={!!incomeOverrides.find(o => o.month === selectedMonth)}
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

            {/* Month Navigation Grid / Calendar View */}
            <Tabs defaultValue="grid" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grid">Month Grid</TabsTrigger>
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              </TabsList>
              <TabsContent value="grid">
                <MonthNavigationGrid
                  months={MONTHS}
                  selectedMonth={selectedMonth}
                  onMonthSelect={setSelectedMonth}
                  getMonthData={(month) => ({
                    name: getMonthName(month),
                    spent: getTotalSpentForMonth(month),
                    remaining: getIncomeForMonth(month) - getTotalSpentForMonth(month)
                  })}
                />
              </TabsContent>
              <TabsContent value="calendar">
                <CalendarView
                  expenses={Object.values(expensesByMonth).flat()}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  goals={goals}
                  onDateSelect={(date) => {
                    const month = date.getMonth() + 1;
                    setSelectedMonth(month);
                  }}
                />
              </TabsContent>
            </Tabs>

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
            <div className="flex justify-between items-center mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <Accordion type="single" collapsible className="w-full">
                {MONTHS.map((monthNumber) => {
                  const monthName = getMonthName(monthNumber);
                  const expenses = expensesByMonth[monthNumber] || [];
                  const totalSpent = getTotalSpentForMonth(monthNumber);
                  const monthIncome = getIncomeForMonth(monthNumber);
                  const remaining = monthIncome - totalSpent;

                  return (
                    <AccordionItem key={monthNumber} value={`month-${monthNumber}`}>
                      <AccordionTrigger className="px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex justify-between items-center w-full pr-4">
                          <span className="font-semibold text-lg">{monthName}</span>
                          <div className="flex gap-4 text-sm">
                            <span className="text-gray-600 dark:text-gray-300">
                              Spent: <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(totalSpent)}</span>
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              Remaining: <span className={`font-semibold ${remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(remaining)}</span>
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <MonthlyExpenseSection
                          monthNumber={monthNumber}
                          monthName={monthName}
                          monthlyIncome={monthIncome}
                          expenses={expenses}
                          fixedExpenses={getFixedExpensesForMonth(monthNumber)}
                          onAddExpense={addExpense}
                          onDeleteExpense={deleteExpense}
                          onUnapplyFixedExpense={handleUnapplyFixedExpense}
                          onOverrideFixedExpense={handleOverrideFixedExpense}
                          onRevertOverride={handleRevertOverride}
                          baseMonthlyIncome={monthlyIncome}
                          isIncomeOverridden={!!incomeOverrides.find(o => o.month === monthNumber)}
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
          </PullToRefresh>
        )}
      </div>
      
      <QuickAddExpenseFAB onExpenseAdded={fetchData} />
    </main>
  );
}
