import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';

interface MonthNavigationGridProps {
  months: number[];
  selectedMonth: number;
  onMonthSelect: (month: number) => void;
  getMonthData: (month: number) => {
    name: string;
    spent: number;
    remaining: number;
  };
}

const MonthNavigationGrid: React.FC<MonthNavigationGridProps> = ({
  months,
  selectedMonth,
  onMonthSelect,
  getMonthData,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Month</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((month) => {
          const data = getMonthData(month);
          const isSelected = month === selectedMonth;
          
          return (
            <Card
              key={month}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
                  : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow'
              }`}
              onClick={() => onMonthSelect(month)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  {data.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(data.spent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Left:</span>
                  <span className={`font-semibold ${data.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.remaining)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MonthNavigationGrid;

