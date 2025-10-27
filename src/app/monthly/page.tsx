"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import YearSelector from '@/components/YearSelector';
import SearchAndFilterPanel, { FilterState } from '@/components/SearchAndFilterPanel';
import SearchResultsDisplay from '@/components/SearchResultsDisplay';
import MonthlyIncomeOverrideDialog from '@/components/MonthlyIncomeOverrideDialog';
import { getMonthName, formatCurrency } from '@/lib/formatters';
import { Pencil, DollarSign, Loader2 } from 'lucide-react';

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

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function Monthly() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [incomeOverrides, setIncomeOverrides] = useState<MonthlyIncomeOverride[]>([]);
  const [expensesByMonth, setExpensesByMonth] = useState<{ [key: number]: Expense[] }>({});
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [expenseToEdit, setExpenseToEdit] = useState<FixedExpense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // Current month (1-12)
  const [viewMode, setViewMode] = useState<'current' | 'all'>('current');
  const [isLoadingIncomeData, setIsLoadingIncomeData] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: 0, max: 100000 },
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch monthly income for the selected year
      const incomeRes = await fetch(`/api/income/monthly?year=${selectedYear}`);
      const incomeData = await incomeRes.json();
      setMonthlyIncome(Number(incomeData.value));

      // Fetch income overrides for the selected year
      const overridesRes = await fetch(`/api/income/monthly/overrides?year=${selectedYear}`);
      const overridesData: MonthlyIncomeOverride[] = await overridesRes.json();
      setIncomeOverrides(overridesData);

      // Fetch all monthly expenses for the selected year
      const expensesRes = await fetch(`/api/expenses/monthly?year=${selectedYear}`);
      const allExpenses: Expense[] = await expensesRes.json();

      // Group expenses by month
      const grouped: { [key: number]: Expense[] } = {};
      MONTHS.forEach(month => {
        grouped[month] = allExpenses.filter(exp => exp.month === month);
      });
      setExpensesByMonth(grouped);

      // Fetch fixed expenses for the selected year
      const fixedRes = await fetch(`/api/fixed-expenses?year=${selectedYear}`);
      const fixedData: FixedExpense[] = await fixedRes.json();
      setFixedExpenses(fixedData);
    };
    fetchData();
    
    // Reset filters when year changes
    setFilters({
      searchQuery: '',
      dateRange: { start: '', end: '' },
      amountRange: { min: 0, max: 100000 },
    });
  }, [selectedYear]);

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

  // Handler to refetch overrides when they change
  const handleIncomeOverrideChange = async (data?: MonthlyIncomeOverride[]) => {
    setIsLoadingIncomeData(true);
    try {
      if (data) {
        // Use provided data directly (from API response)
        setIncomeOverrides(data);
      } else {
        // Fetch from API (for initial page load)
        const overridesRes = await fetch(`/api/income/monthly/overrides?year=${selectedYear}`, {
          cache: 'no-store'
        });
        const overridesData: MonthlyIncomeOverride[] = await overridesRes.json();
        setIncomeOverrides(overridesData);
      }
    } catch (error) {
      console.error('Error fetching income overrides:', error);
    } finally {
      setIsLoadingIncomeData(false);
    }
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
        body: JSON.stringify({ income: newIncome, year: selectedYear }),
      });
      setMonthlyIncome(newIncome);
      setIsDialogOpen(false);
    }
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

  // Flatten all expenses for filtering
  const allExpenses = useMemo(() => {
    const expenses: Expense[] = [];
    MONTHS.forEach(month => {
      const monthExpenses = expensesByMonth[month] || [];
      expenses.push(...monthExpenses);
    });
    return expenses;
  }, [expensesByMonth]);

  // Filter expenses based on search and filter criteria
  const filteredExpenses = useMemo(() => {
    let result = [...allExpenses];

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(exp => exp.name.toLowerCase().includes(query));
    }

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      result = result.filter(exp => {
        if (!exp.date) return false;
        const expDate = new Date(exp.date);
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

        if (startDate && expDate < startDate) return false;
        if (endDate && expDate > endDate) return false;
        return true;
      });
    }

    // Apply amount range filter
    if (filters.amountRange.min > 0 || filters.amountRange.max < 100000) {
      result = result.filter(exp => 
        exp.amount >= filters.amountRange.min && exp.amount <= filters.amountRange.max
      );
    }

    return result;
  }, [allExpenses, filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.searchQuery !== '' ||
      filters.dateRange.start !== '' ||
      filters.dateRange.end !== '' ||
      filters.amountRange.min !== 0 ||
      filters.amountRange.max !== 100000
    );
  };

  // Calculate max amount for slider
  const maxAmount = useMemo(() => {
    if (allExpenses.length === 0) return 100000;
    return Math.max(...allExpenses.map(exp => exp.amount), 100000);
  }, [allExpenses]);

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
          <div className="flex gap-2 items-center">
            <YearSelector 
              selectedYear={selectedYear} 
              onYearChange={setSelectedYear} 
            />
            <Link href="/">
              <Button>Track Yearly</Button>
            </Link>
          </div>
        </div>

        {/* Income Display */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 relative">
          {isLoadingIncomeData && (
            <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg border">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Updating income data...</span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-700">Base Monthly Income:</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">{formatCurrency(monthlyIncome)}</span>
                {isLoadingIncomeData && (
                  <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                )}
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditIncome}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Base
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Base Monthly Income</DialogTitle>
                    <DialogDescription>
                      Update your base monthly income amount. This will be the default for all months unless overridden.
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
              <MonthlyIncomeOverrideDialog
                baseMonthlyIncome={monthlyIncome}
                year={selectedYear}
                overrides={incomeOverrides}
                onOverrideChange={handleIncomeOverrideChange}
              />
            </div>
          </div>
        </div>

        {/* Search and Filter Panel */}
        <SearchAndFilterPanel
          onFilterChange={handleFilterChange}
          initialFilters={filters}
          year={selectedYear}
          maxAmount={maxAmount}
        />

        {/* Show search results if filters are active */}
        {hasActiveFilters() && (
          <SearchResultsDisplay
            expenses={filteredExpenses}
            title="Filtered Expenses"
            showMonth={true}
          />
        )}

        {/* Conditional Rendering based on View Mode */}
        {viewMode === 'current' ? (
          <>
            {/* Current Month Expenses - Prominent Display */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 relative">
              {isLoadingIncomeData && (
                <div className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {getMonthName(selectedMonth)} Expenses
                </h2>
                <div className="text-sm text-gray-600">
                  Spent: <span className="font-semibold text-red-600">{formatCurrency(getTotalSpentForMonth(selectedMonth))}</span>
                  {' | '}
                  Remaining: <span className={`font-semibold ${(getIncomeForMonth(selectedMonth) - getTotalSpentForMonth(selectedMonth)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(getIncomeForMonth(selectedMonth) - getTotalSpentForMonth(selectedMonth))}
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

            {/* Month Navigation Grid */}
            <div className="relative">
              {isLoadingIncomeData && (
                <div className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              )}
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
            </div>

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
                  const monthIncome = getIncomeForMonth(monthNumber);
                  const remaining = monthIncome - totalSpent;

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
    </main>
  );
}
