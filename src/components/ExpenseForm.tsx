import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ExpenseFormProps {
  addExpense: (expense: { name: string; amount: number }) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ addExpense }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (name && numericAmount > 0) {
      addExpense({ name, amount: numericAmount });
      setName('');
      setAmount('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b">
      <h2 className="text-lg font-medium mb-2">Add New Expense</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expense-name">Expense Name</Label>
          <Input
            id="expense-name"
            type="text"
            placeholder="e.g., Rent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="expense-amount">Amount (INR)</Label>
          <Input
            id="expense-amount"
            type="text"
            placeholder="e.g., 20000.50"
            value={amount}
            onChange={handleAmountChange}
            className="mt-1 no-arrows"
          />
        </div>
      </div>
      <Button type="submit" className="mt-4 w-full">
        Add Expense
      </Button>
    </form>
  );
};

export default ExpenseForm;