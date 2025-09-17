import React from 'react';
import { Button } from '@/components/ui/button';
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
  id: number;
  name: string;
  amount: number;
}

interface ExpenseListProps {
  expenses: Expense[];
  deleteExpense: (id: number) => void;
  requestSort: (key: 'name' | 'amount') => void;
  sortConfig: { key: 'name' | 'amount'; direction: 'ascending' | 'descending' } | null;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, deleteExpense, requestSort, sortConfig }) => {
  const getSortIndicator = (key: 'name' | 'amount') => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-2">Expenses</h2>
      {expenses.length === 0 ? (
        <p>No expenses added yet.</p>
      ) : (
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
            {expenses.map((expense) => (
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
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ExpenseList;