"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { EmptyState } from '@/components/EmptyState';

interface Expense {
  id: string;
  name: string;
  amount: number;
  month?: number;
  date?: string;
  type?: string;
}

interface SearchResultsDisplayProps {
  expenses: Expense[];
  title?: string;
  showMonth?: boolean;
}

const SearchResultsDisplay: React.FC<SearchResultsDisplayProps> = ({
  expenses,
  title = "Search Results",
  showMonth = true,
}) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthName = (month?: number) => {
    if (!month) return 'Yearly';
    return monthNames[month - 1];
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return date;
    }
  };

  if (expenses.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-0">
          <EmptyState variant="search" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">
          {title} ({expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {showMonth && <TableHead>Month</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.name}</TableCell>
                  {showMonth && (
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded ${
                        expense.month 
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {getMonthName(expense.month)}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(expense.date)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchResultsDisplay;

