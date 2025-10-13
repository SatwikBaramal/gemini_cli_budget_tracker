import React from 'react';
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
}

interface ExpenseListProps {
  expenses: Expense[];
  deleteExpense: (id: string) => void;
  requestSort: (key: 'name' | 'amount') => void;
  sortConfig: { key: 'name' | 'amount'; direction: 'ascending' | 'descending' } | null;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, deleteExpense, requestSort, sortConfig }) => {
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
          <TableHead className="text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.length > 0 ? (
          expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{expense.name}</TableCell>
              <TableCell className="text-right">
                ₹{expense.amount.toLocaleString('en-IN')}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-red-500 hover:text-white"
                  onClick={() => deleteExpense(expense.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow key="empty">
            <TableCell colSpan={3} className="text-center">
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
        <CardTitle>Expenses</CardTitle>
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