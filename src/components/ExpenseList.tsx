import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowUpDown } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

interface Expense {
  id: string;
  name: string;
  amount: number;
  month?: number;  // 1-12 for monthly expenses
  type?: string;   // 'yearly' or 'monthly'
}

interface ExpenseListProps {
  expenses: Expense[];
  requestSort: (key: 'name' | 'amount') => void;
  sortConfig: { key: 'name' | 'amount'; direction: 'ascending' | 'descending' } | null;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, requestSort, sortConfig }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Filter expenses based on selected month
  const filteredExpenses = useMemo(() => {
    if (selectedMonth === 'all') {
      return expenses;
    } else if (selectedMonth === 'yearly') {
      // Only show expenses explicitly marked as yearly
      return expenses.filter(exp => exp.type === 'yearly' || (!exp.month && !exp.type));
    } else {
      const monthNum = parseInt(selectedMonth);
      return expenses.filter(exp => exp.month === monthNum);
    }
  }, [expenses, selectedMonth]);
  
  const getSortIndicator = (key: 'name' | 'amount') => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    // Simplified indicator for brevity
    return <ArrowUpDown className="ml-2 h-4 w-4 text-blue-500" />;
  };

  const expenseTable = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button variant="ghost" onClick={() => requestSort('name')}>
              Name
              {getSortIndicator('name')}
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button variant="ghost" onClick={() => requestSort('amount')}>
              Amount
              {getSortIndicator('amount')}
            </Button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {expense.name}
                  {selectedMonth === 'all' && expense.month && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                      {monthNames[expense.month - 1].substring(0, 3)}
                    </span>
                  )}
                  {selectedMonth === 'all' && !expense.month && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                      Yearly
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                ₹{expense.amount.toLocaleString('en-IN')}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow key="empty">
            <TableCell colSpan={2} className="p-0">
              <EmptyState variant="expenses" />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  // Mobile accordion view
  const mobileExpenseList = (
    <Accordion type="single" collapsible className="w-full space-y-2">
      {filteredExpenses.length > 0 ? (
        filteredExpenses.slice(0, 10).map((expense) => (
          <AccordionItem 
            key={expense.id} 
            value={expense.id}
            className="border dark:border-gray-700 rounded-lg px-4 bg-gray-50 dark:bg-gray-800/50"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex justify-between items-center w-full pr-2">
                <span className="font-medium text-sm">{expense.name}</span>
                <span className="font-bold text-sm">₹{expense.amount.toLocaleString('en-IN')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 pb-2 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-semibold">₹{expense.amount.toLocaleString('en-IN')}</span>
                </div>
                {expense.month && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Month:</span>
                    <span className="font-semibold">{monthNames[expense.month - 1]}</span>
                  </div>
                )}
                {!expense.month && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-semibold">Yearly</span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))
      ) : (
        <EmptyState variant="expenses" />
      )}
    </Accordion>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle>Expenses</CardTitle>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full sm:w-auto min-h-[44px]"
          >
            <option value="all">All Expenses</option>
            <option value="yearly">Yearly Only</option>
            {monthNames.map((month, idx) => (
              <option key={idx + 1} value={String(idx + 1)}>{month}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Desktop view - Table */}
        <div className="hidden sm:block h-96 overflow-y-auto border dark:border-gray-700 rounded-md">
          {expenseTable}
        </div>
        
        {/* Mobile view - Accordion */}
        <div className="sm:hidden max-h-96 overflow-y-auto">
          {mobileExpenseList}
        </div>
        
        {filteredExpenses.length > 10 && (
          <p className="text-sm text-gray-500 text-center sm:hidden">
            Showing 10 of {filteredExpenses.length} expenses
          </p>
        )}
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">View All Expenses</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>All Expenses</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              {expenseTable}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ExpenseList;