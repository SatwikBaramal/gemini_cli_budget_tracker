import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LineChartComponent from './LineChartComponent';
import { Summary } from './Summary';

interface Expense {
  id: string;
  name: string;
  amount: number;
  month?: number;
  type?: string;
}

interface FixedExpenseOverride {
  id: string;
  fixed_expense_id: string;
  month: number;
  override_amount: number;
  date: string;
}

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  applicable_months: number[];
  overrides?: FixedExpenseOverride[];
}

interface DashboardProps {
  monthlyIncome: number;
  selectedYear?: number;
}

type TimePeriod = 'this-month' | 'last-month' | 'past-3-months' | 'past-6-months' | 'entire-year';

const Dashboard: React.FC<DashboardProps> = ({ monthlyIncome, selectedYear }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('this-month');
  const [monthlyExpenses, setMonthlyExpenses] = useState<Expense[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch monthly expenses
        const monthlyRes = await fetch('/api/expenses/monthly');
        const monthlyData = await monthlyRes.json();
        setMonthlyExpenses(monthlyData);

        // Fetch fixed expenses
        const fixedRes = await fetch('/api/fixed-expenses');
        const fixedData = await fixedRes.json();
        setFixedExpenses(fixedData);
      } catch (error) {
        console.error('Error fetching expense data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getMonthsInPeriod = (): number[] => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    switch (timePeriod) {
      case 'this-month':
        return [currentMonth];
      
      case 'last-month': {
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        return [lastMonth];
      }
      
      case 'past-3-months': {
        const months: number[] = [];
        for (let i = 0; i < 3; i++) {
          let month = currentMonth - i;
          if (month <= 0) month += 12;
          months.push(month);
        }
        return months;
      }
      
      case 'past-6-months': {
        const months: number[] = [];
        for (let i = 0; i < 6; i++) {
          let month = currentMonth - i;
          if (month <= 0) month += 12;
          months.push(month);
        }
        return months;
      }
      
      case 'entire-year':
        return Array.from({ length: 12 }, (_, i) => i + 1);
      
      default:
        return [currentMonth];
    }
  };

  const calculateTotalExpenses = (): number => {
    const monthsInPeriod = getMonthsInPeriod();
    
    // Calculate monthly expenses for the selected period
    const monthlyTotal = monthlyExpenses
      .filter(expense => expense.month && monthsInPeriod.includes(expense.month))
      .reduce((acc, expense) => acc + expense.amount, 0);
    
    // Calculate fixed expenses for the selected period
    const fixedTotal = fixedExpenses.reduce((acc, fixedExpense) => {
      // For each month in the period, check if this fixed expense applies
      const applicableMonths = fixedExpense.applicable_months.filter(month => 
        monthsInPeriod.includes(month)
      );
      
      // Sum the fixed expense for each applicable month
      const fixedExpenseTotal = applicableMonths.reduce((sum, month) => {
        // Check if there's an override for this month
        const override = fixedExpense.overrides?.find(o => o.month === month);
        return sum + (override ? override.override_amount : fixedExpense.amount);
      }, 0);
      
      return acc + fixedExpenseTotal;
    }, 0);
    
    return monthlyTotal + fixedTotal;
  };

  const totalExpenses = calculateTotalExpenses();

  const timePeriodOptions = [
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'past-3-months', label: 'Past 3 Months' },
    { value: 'past-6-months', label: 'Past 6 Months' },
    { value: 'entire-year', label: 'Entire Year' },
  ] as const;

  return (
    <div className="p-2 sm:p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              ₹{monthlyIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Expenses</CardTitle>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white w-full sm:w-auto"
            >
              {timePeriodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                `₹${totalExpenses.toLocaleString('en-IN')}`
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 mt-4">
        <LineChartComponent selectedYear={selectedYear} />
        <Summary />
      </div>
    </div>
  );
};

export default Dashboard;