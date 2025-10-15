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
import { ArrowUpDown } from 'lucide-react';

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
      return expenses.filter(exp => !exp.month || exp.type === 'yearly');
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
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {monthNames[expense.month - 1].substring(0, 3)}
                    </span>
                  )}
                  {selectedMonth === 'all' && !expense.month && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
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
            <TableCell colSpan={2} className="text-center">
              No expenses added yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Expenses</CardTitle>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded-md px-3 py-1 text-sm"
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
        <div className="h-96 overflow-y-auto border rounded-md">
          {expenseTable}
        </div>
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