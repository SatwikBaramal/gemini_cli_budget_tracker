"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import ExpenseList from '@/components/ExpenseList';
import Dashboard from '@/components/Dashboard';
import { GoalsSection } from '@/components/GoalsSection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { QuickAddExpenseFAB } from '@/components/QuickAddExpenseFAB';
import { toast } from '@/lib/toast';
import { Skeleton } from '@/components/ui/skeleton';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useCallback } from 'react';

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch yearly, monthly, and fixed expenses for the selected year
        const [yearlyRes, monthlyRes, fixedRes] = await Promise.all([
          fetch(`/api/expenses?year=${selectedYear}`),
          fetch(`/api/expenses/monthly?year=${selectedYear}`),
          fetch(`/api/fixed-expenses?year=${selectedYear}`)
        ]);
        
        if (!yearlyRes.ok || !monthlyRes.ok || !fixedRes.ok) {
          throw new Error('Failed to fetch expenses data');
        }
        
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

  const sortedExpenses = useMemo(() => {
    const sortableExpenses = [...expenses];
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
  }, [expenses, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header selectedYear={selectedYear} onYearChange={setSelectedYear} />
      <div className="container mx-auto p-2 sm:p-4">

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-white dark:bg-gray-800/80 border-2 border-gray-200 dark:border-white/20 rounded-lg shadow-md gap-3">
              <h2 className="text-lg font-medium">Yearly Expenses - {selectedYear}</h2>
              <Link href="/monthly" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Track Monthly</Button>
              </Link>
            </div>
            
            <Link href="/monthly">
              <Button className="w-full mb-4">Add Expense</Button>
            </Link>
            
            <ExpenseList
              expenses={sortedExpenses}
              requestSort={requestSort}
              sortConfig={sortConfig}
            />
          </div>
          <div className="space-y-4">
            <Dashboard selectedYear={selectedYear} />
          </div>
        </div>

        {/* Savings Goals Section */}
        <div className="mt-6">
          <GoalsSection />
        </div>
        </div>
          </PullToRefresh>
        )}
      </div>
      
      <QuickAddExpenseFAB onExpenseAdded={() => window.location.reload()} />
    </main>
  );
}