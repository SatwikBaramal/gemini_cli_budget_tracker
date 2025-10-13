"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import IncomeInput from '@/components/IncomeInput';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import Dashboard from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Expense {
  id: string;
  name: string;
  amount: number;
}

type SortKey = 'name' | 'amount';

export default function Home() {
  const [yearlyIncome, setYearlyIncome] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

  useEffect(() => {
    const fetchData = async () => {
      const incomeRes = await fetch('/api/income');
      const incomeData = await incomeRes.json();
      setYearlyIncome(Number(incomeData.value));

      // Fetch both yearly and monthly expenses
      const [yearlyRes, monthlyRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/expenses/monthly')
      ]);
      
      const yearlyExpenses = await yearlyRes.json();
      const monthlyExpenses = await monthlyRes.json();
      
      // Combine all expenses for display
      setExpenses([...yearlyExpenses, ...monthlyExpenses]);
    };
    fetchData();
  }, []);

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

  const updateYearlyIncome = async (income: number) => {
    setYearlyIncome(income);
    await fetch('/api/income', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ income }),
    });
  };

  const addExpense = async (expense: { name: string; amount: number }) => {
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });
    const newExpense = await response.json();
    setExpenses([...expenses, newExpense]);
  };

  const deleteExpense = async (id: string) => {
    await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-200 rounded-md">
              <h2 className="text-lg font-medium text-center">Yearly</h2>
              <Link href="/monthly">
                <Button>Track Monthly</Button>
              </Link>
            </div>
            <IncomeInput label="Yearly Income (INR)" value={yearlyIncome} onChange={updateYearlyIncome} />
            <ExpenseForm addExpense={addExpense} />
            <ExpenseList
              expenses={sortedExpenses}
              deleteExpense={deleteExpense}
              requestSort={requestSort}
              sortConfig={sortConfig}
            />
          </div>
          <div className="space-y-4">
            <Dashboard monthlyIncome={yearlyIncome / 12} expenses={expenses} />
          </div>
        </div>
      </div>
    </main>
  );
}