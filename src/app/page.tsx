"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import IncomeInput from '@/components/IncomeInput';
import ExpenseList from '@/components/ExpenseList';
import Dashboard from '@/components/Dashboard';
import YearSelector from '@/components/YearSelector';
import SearchAndFilterPanel, { FilterState } from '@/components/SearchAndFilterPanel';
import SearchResultsDisplay from '@/components/SearchResultsDisplay';
import { GoalsSection } from '@/components/GoalsSection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Expense {
  id: string;
  name: string;
  amount: number;
  month?: number;
  type?: string;
  date?: string;
}

interface FixedExpenseAPI {
  id: string;
  name: string;
  amount: number;
  applicable_months: number[];
  year: number;
  overrides?: Array<{
    id: string;
    fixed_expense_id: string;
    month: number;
    override_amount: number;
    date: string;
    year: number;
  }>;
}

type SortKey = 'name' | 'amount';

export default function Home() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearlyIncome, setYearlyIncome] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: 0, max: 100000 },
  });

  useEffect(() => {
    const fetchData = async () => {
      const incomeRes = await fetch(`/api/income?year=${selectedYear}`);
      const incomeData = await incomeRes.json();
      setYearlyIncome(Number(incomeData.value));

      // Fetch yearly, monthly, and fixed expenses for the selected year
      const [yearlyRes, monthlyRes, fixedRes] = await Promise.all([
        fetch(`/api/expenses?year=${selectedYear}`),
        fetch(`/api/expenses/monthly?year=${selectedYear}`),
        fetch(`/api/fixed-expenses?year=${selectedYear}`)
      ]);
      
      const yearlyExpenses = await yearlyRes.json();
      const monthlyExpenses = await monthlyRes.json();
      const fixedExpenses = await fixedRes.json();

      // Transform fixed expenses into individual expense entries for each applicable month
      const expandedFixedExpenses: Expense[] = fixedExpenses.flatMap((fixed: FixedExpenseAPI) => {
        return fixed.applicable_months.map((month: number) => {
          // Check if there's an override for this month
          const override = fixed.overrides?.find((o) => o.month === month);
          const amount = override ? override.override_amount : fixed.amount;
          
          return {
            id: `fixed-${fixed.id}-${month}`,
            name: fixed.name,
            amount: amount,
            month: month,
            type: 'fixed',
            date: override?.date || `${selectedYear}-${String(month).padStart(2, '0')}-01`,
          };
        });
      });
      
      // Combine all expenses for display
      setExpenses([...yearlyExpenses, ...monthlyExpenses, ...expandedFixedExpenses]);
    };
    fetchData();
    
    // Reset filters when year changes
    setFilters({
      searchQuery: '',
      dateRange: { start: '', end: '' },
      amountRange: { min: 0, max: 100000 },
    });
  }, [selectedYear]);

  // Filter expenses based on search and filter criteria
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

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
  }, [expenses, filters]);

  const sortedExpenses = useMemo(() => {
    const sortableExpenses = [...filteredExpenses];
    if (sortConfig !== null) {
      sortableExpenses.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableExpenses;
  }, [filteredExpenses, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const updateYearlyIncome = async (income: number) => {
    setYearlyIncome(income);
    await fetch('/api/income', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ income, year: selectedYear }),
    });
  };

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
    if (expenses.length === 0) return 100000;
    return Math.max(...expenses.map(exp => exp.amount), 100000);
  }, [expenses]);

  return (
    <main className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-200 rounded-md">
              <h2 className="text-lg font-medium text-center">Yearly</h2>
              <div className="flex gap-2 items-center">
                <YearSelector 
                  selectedYear={selectedYear} 
                  onYearChange={setSelectedYear} 
                />
                <Link href="/monthly">
                  <Button>Track Monthly</Button>
                </Link>
              </div>
            </div>
            <IncomeInput label="Yearly Income (INR)" value={yearlyIncome} onChange={updateYearlyIncome} />
            <Link href="/monthly">
              <Button className="w-full mb-4">Add Expense</Button>
            </Link>
            <SearchAndFilterPanel
              onFilterChange={handleFilterChange}
              initialFilters={filters}
              year={selectedYear}
              maxAmount={maxAmount}
            />
            {hasActiveFilters() ? (
              <SearchResultsDisplay
                expenses={sortedExpenses}
                title="Filtered Expenses"
                showMonth={true}
              />
            ) : (
              <ExpenseList
                expenses={sortedExpenses}
                requestSort={requestSort}
                sortConfig={sortConfig}
              />
            )}
          </div>
          <div className="space-y-4">
            <Dashboard monthlyIncome={yearlyIncome / 12} expenses={expenses} />
          </div>
        </div>

        {/* Savings Goals Section */}
        <div className="mt-6">
          <GoalsSection />
        </div>
      </div>
    </main>
  );
}