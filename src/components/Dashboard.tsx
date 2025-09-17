import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PieChartComponent from './PieChartComponent'; // This component will be created next

interface Expense {
  id: number;
  name: string;
  amount: number;
}

interface DashboardProps {
  yearlyIncome: number;
  expenses: Expense[];
}

const Dashboard: React.FC<DashboardProps> = ({ yearlyIncome, expenses }) => {
  const monthlyIncome = yearlyIncome / 12;
  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  const remainingBalance = monthlyIncome - totalExpenses;

  return (
    <div className="p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{monthlyIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{remainingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        <PieChartComponent expenses={expenses} />
      </div>
    </div>
  );
};

export default Dashboard;