"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'All';
type ViewMode = 'expenses' | 'savings';

interface MonthlyExpense {
  id: string;
  name: string;
  amount: number;
  type: string;
  month?: number;
  date?: string;
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

interface MonthData {
  month: string;
  monthNumber: number;
  value: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface LineChartComponentProps {
  selectedYear?: number;
}

const LineChartComponent: React.FC<LineChartComponentProps> = ({ 
  selectedYear = new Date().getFullYear() 
}) => {
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('6M');
  const [viewMode, setViewMode] = useState<ViewMode>('expenses');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [expensesRes, fixedRes, incomeRes] = await Promise.all([
          fetch(`/api/expenses/monthly?year=${selectedYear}`),
          fetch(`/api/fixed-expenses?year=${selectedYear}`),
          fetch(`/api/income/monthly?year=${selectedYear}`)
        ]);
        
        const expenses = await expensesRes.json();
        const fixed = await fixedRes.json();
        const incomeData = await incomeRes.json();
        
        setMonthlyExpenses(expenses);
        setFixedExpenses(fixed);
        setMonthlyIncome(Number(incomeData.value));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  const processedData = useMemo(() => {
    // Aggregate monthly expenses by month
    const monthlyExpensesByMonth = monthlyExpenses.reduce((acc, expense) => {
      const month = expense.month || 0;
      if (month > 0 && month <= 12) {
        acc[month] = (acc[month] || 0) + expense.amount;
      }
      return acc;
    }, {} as Record<number, number>);

    // Calculate fixed expenses for each month
    const calculateFixedExpensesForMonth = (monthNumber: number): number => {
      return fixedExpenses.reduce((total, fixedExpense) => {
        // Check if this fixed expense applies to the month
        if (!fixedExpense.applicable_months.includes(monthNumber)) {
          return total;
        }
        
        // Check if there's an override for this month
        const override = fixedExpense.overrides?.find(o => o.month === monthNumber);
        const amount = override ? override.override_amount : fixedExpense.amount;
        
        return total + amount;
      }, 0);
    };

    // Create data for all 12 months
    const allMonthsData: MonthData[] = Array.from({ length: 12 }, (_, i) => {
      const monthNumber = i + 1;
      const monthlyExpensesTotal = monthlyExpensesByMonth[monthNumber] || 0;
      const fixedExpensesTotal = calculateFixedExpensesForMonth(monthNumber);
      const totalExpenses = monthlyExpensesTotal + fixedExpensesTotal;
      const savings = monthlyIncome - totalExpenses;
      
      return {
        month: MONTH_NAMES[i],
        monthNumber,
        value: viewMode === 'expenses' ? totalExpenses : savings
      };
    });

    // Filter based on selected time period
    const currentMonth = new Date().getMonth() + 1; // 1-12
    let filteredData: MonthData[];

    switch (selectedPeriod) {
      case '1M':
        filteredData = allMonthsData.filter(d => d.monthNumber === currentMonth);
        break;
      case '3M':
        filteredData = allMonthsData.filter(d => {
          const diff = (currentMonth - d.monthNumber + 12) % 12;
          return diff < 3;
        });
        break;
      case '6M':
        filteredData = allMonthsData.filter(d => {
          const diff = (currentMonth - d.monthNumber + 12) % 12;
          return diff < 6;
        });
        break;
      case '1Y':
        filteredData = allMonthsData;
        break;
      case 'All':
        filteredData = allMonthsData;
        break;
      default:
        filteredData = allMonthsData;
    }

    // Sort chronologically
    return filteredData.sort((a, b) => {
      if (selectedPeriod === 'All' || selectedPeriod === '1Y') {
        return a.monthNumber - b.monthNumber;
      }
      // For shorter periods, maintain relative order from current month backwards
      const currentIdx = currentMonth - 1;
      const aIdx = a.monthNumber - 1;
      const bIdx = b.monthNumber - 1;
      
      const aDistance = (currentIdx - aIdx + 12) % 12;
      const bDistance = (currentIdx - bIdx + 12) % 12;
      
      return bDistance - aDistance;
    });
  }, [monthlyExpenses, fixedExpenses, monthlyIncome, selectedPeriod, viewMode]);

  // Calculate percentage change (simplified)
  const percentageChange = useMemo(() => {
    if (processedData.length < 2) return 0;
    const firstValue = processedData[0].value;
    const lastValue = processedData[processedData.length - 1].value;
    if (firstValue === 0) return 0;
    return ((lastValue - firstValue) / firstValue) * 100;
  }, [processedData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-md">
          <p className="text-sm font-medium">{payload[0].payload.month}</p>
          <p className="text-sm text-green-600">
            ₹{payload[0].value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg font-medium mb-2">
              Monthly {viewMode === 'expenses' ? 'Expenses' : 'Savings'} Trend
            </CardTitle>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl sm:text-2xl font-bold ${percentageChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
              </span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{selectedPeriod} period</span>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant={viewMode === 'expenses' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('expenses')}
              className="flex-1 sm:flex-none"
            >
              Expenses
            </Button>
            <Button
              variant={viewMode === 'savings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('savings')}
              className="flex-1 sm:flex-none"
            >
              Savings
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={processedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 10 }}
              stroke="#888"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              stroke="#888"
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Time period selector */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {(['1M', '3M', '6M', '1Y', 'All'] as TimePeriod[]).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className="min-w-[45px] sm:min-w-[50px] px-2 sm:px-3"
            >
              {period}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LineChartComponent;

