'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  month: number;
}

interface Goal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO date string
  status: 'active' | 'completed' | 'archived';
}

interface CalendarViewProps {
  expenses: Expense[];
  selectedMonth: number;
  selectedYear: number;
  goals?: Goal[];
  onDateSelect?: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  expenses,
  selectedMonth,
  selectedYear,
  goals = [],
  onDateSelect,
}) => {
  const [viewMonth, setViewMonth] = useState(selectedMonth);
  const [viewYear, setViewYear] = useState(selectedYear);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewMonth, viewYear);
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
    const days: (number | null)[] = [];

    // Add empty slots for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [viewMonth, viewYear]);

  // Get expenses for a specific date
  const getExpensesForDate = (day: number) => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return (
        expDate.getDate() === day &&
        expDate.getMonth() + 1 === viewMonth &&
        expDate.getFullYear() === viewYear
      );
    });
  };

  // Get total for a date
  const getTotalForDate = (day: number) => {
    const dayExpenses = getExpensesForDate(day);
    return dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  // Get goal for a specific date
  const getGoalForDate = (day: number): Goal | null => {
    if (!goals || goals.length === 0) return null;
    
    const goal = goals.find(g => {
      const goalDate = new Date(g.deadline);
      return (
        goalDate.getDate() === day &&
        goalDate.getMonth() + 1 === viewMonth &&
        goalDate.getFullYear() === viewYear
      );
    });
    
    return goal || null;
  };

  // Get background color class for goal
  const getGoalBackgroundColor = (goal: Goal): string => {
    if (goal.status === 'archived') {
      return 'bg-amber-800/30 dark:bg-amber-900/50';
    }
    // active or completed
    return 'bg-yellow-100 dark:bg-yellow-900';
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      viewMonth === today.getMonth() + 1 &&
      viewYear === today.getFullYear()
    );
  };

  return (
    <Card>
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-lg font-semibold">
            {monthNames[viewMonth - 1]} {viewYear}
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-0.5 mb-2">
          {dayNames.map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-20" />;
            }

            const dayExpenses = getExpensesForDate(day);
            const hasExpenses = dayExpenses.length > 0;
            const total = getTotalForDate(day);
            const goalForDate = getGoalForDate(day);
            const hasGoal = goalForDate !== null;

            // Determine background color based on priority: goal > today > default
            let bgColor = 'hover:bg-gray-100 dark:hover:bg-gray-800';
            if (hasGoal) {
              bgColor = getGoalBackgroundColor(goalForDate);
            } else if (isToday(day)) {
              bgColor = 'bg-blue-100 dark:bg-blue-900';
            }

            const cellContent = (
              <button
                onClick={() => {
                  if (onDateSelect) {
                    onDateSelect(new Date(viewYear, viewMonth - 1, day));
                  }
                }}
                className={`
                  h-20 p-0.5 rounded-lg text-sm transition-colors w-full
                  ${bgColor}
                  ${hasExpenses || hasGoal ? 'font-semibold' : ''}
                  ${isToday(day) && !hasGoal ? 'font-bold' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className={`${hasGoal ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-900 dark:text-gray-100'}`}>
                    {day}
                  </span>
                  
                  {hasGoal && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Target className="w-2.5 h-2.5 text-gray-700 dark:text-gray-300" />
                      <span className="text-[9px] text-gray-700 dark:text-gray-300 truncate max-w-[90%]">
                        {goalForDate.name.length > 10 ? goalForDate.name.substring(0, 10) + '...' : goalForDate.name}
                      </span>
                    </div>
                  )}
                  
                  {hasExpenses && (
                    <>
                      <div className="flex gap-0.5 mt-0.5">
                        {dayExpenses.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            className="w-1 h-1 rounded-full bg-red-500"
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">
                        ₹{(total / 1000).toFixed(0)}k
                      </span>
                    </>
                  )}
                </div>
              </button>
            );

            // Wrap with Popover if there are expenses or goal
            if (hasExpenses || hasGoal) {
              return (
                <Popover key={day} open={hoveredDay === day} onOpenChange={(open) => !open && setHoveredDay(null)}>
                  <PopoverTrigger asChild>
                    <div 
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {cellContent}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-64 p-3"
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <div className="space-y-3">
                      {goalForDate && (
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            <h4 className="font-semibold text-sm">Goal Deadline</h4>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{goalForDate.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Target: ₹{goalForDate.targetAmount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Current: ₹{goalForDate.currentAmount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 capitalize">
                            Status: {goalForDate.status}
                          </p>
                        </div>
                      )}
                      
                      {hasExpenses && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">
                            Expenses ({dayExpenses.length})
                          </h4>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {dayExpenses.map(exp => (
                              <div key={exp.id} className="flex justify-between text-xs">
                                <span className="text-gray-700 dark:text-gray-300 truncate mr-2">{exp.name}</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                  ₹{exp.amount.toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                            <div className="flex justify-between text-sm font-bold">
                              <span>Total:</span>
                              <span>₹{total.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }

            return <div key={day}>{cellContent}</div>;
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Has expenses</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900" />
              <span>Goal Deadline (Active)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-amber-800/30 dark:bg-amber-900/50" />
              <span>Goal Deadline (Archived)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

