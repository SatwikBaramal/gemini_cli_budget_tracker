'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface ExportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDataDialog({ open, onOpenChange }: ExportDataDialogProps) {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingYears, setIsLoadingYears] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMonthFilter, setShowMonthFilter] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [includeAI, setIncludeAI] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableYears();
    } else {
      // Reset state on dialog close
      setShowMonthFilter(false);
      setSelectedMonths([]);
      setIncludeAI(false);
    }
  }, [open]);

  const fetchAvailableYears = async () => {
    setIsLoadingYears(true);
    setError(null);
    try {
      // Fetch years from multiple sources
      const [yearlyExpensesRes, monthlyExpensesRes, fixedExpensesRes, incomeRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/expenses/monthly'),
        fetch('/api/fixed-expenses'),
        fetch('/api/income'),
      ]);

      // Extract unique years from all sources
      const years = new Set<number>();

      // Check yearly expenses
      if (yearlyExpensesRes.ok) {
        const yearlyExpenses = await yearlyExpensesRes.json();
        yearlyExpenses.forEach((expense: { year?: number }) => {
          if (expense.year) years.add(expense.year);
        });
      }

      // Check monthly expenses
      if (monthlyExpensesRes.ok) {
        const monthlyExpenses = await monthlyExpensesRes.json();
        monthlyExpenses.forEach((expense: { year?: number }) => {
          if (expense.year) years.add(expense.year);
        });
      }

      // Check fixed expenses
      if (fixedExpensesRes.ok) {
        const fixedExpenses = await fixedExpensesRes.json();
        fixedExpenses.forEach((expense: { year?: number }) => {
          if (expense.year) years.add(expense.year);
        });
      }

      // Check income settings
      if (incomeRes.ok) {
        const incomeData = await incomeRes.json();
        if (incomeData.year) years.add(incomeData.year);
      }

      // If no years found, add current year as default
      if (years.size === 0) {
        years.add(new Date().getFullYear());
      }

      const sortedYears = Array.from(years).sort((a, b) => b - a);
      setAvailableYears(sortedYears);

      // Pre-select current year if available
      const currentYear = new Date().getFullYear();
      if (sortedYears.includes(currentYear)) {
        setSelectedYears([currentYear]);
      } else if (sortedYears.length > 0) {
        setSelectedYears([sortedYears[0]]);
      }
    } catch (err) {
      console.error('Error fetching years:', err);
      setError('Failed to load available years');
      // Even on error, show current year as fallback
      const currentYear = new Date().getFullYear();
      setAvailableYears([currentYear]);
      setSelectedYears([currentYear]);
    } finally {
      setIsLoadingYears(false);
    }
  };

  const toggleYear = (year: number) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        return prev.filter(y => y !== year);
      } else {
        return [...prev, year].sort((a, b) => b - a);
      }
    });
  };

  const toggleMonth = (month: number) => {
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        return prev.filter(m => m !== month);
      } else {
        return [...prev, month].sort((a, b) => a - b);
      }
    });
  };

  const handleExport = async () => {
    if (selectedYears.length === 0) {
      setError('Please select at least one year to export');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('years', selectedYears.join(','));
      if (selectedMonths.length > 0) {
        params.set('months', selectedMonths.join(','));
      }
      if (includeAI) {
        params.set('ai', 'true');
      }

      const response = await fetch(`/api/export/excel?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Generate filename
      const yearPart = selectedYears.length === 1
        ? `${selectedYears[0]}`
        : `${Math.min(...selectedYears)}-${Math.max(...selectedYears)}`;

      let filename: string;
      if (selectedMonths.length > 0) {
        const monthNamesPart = selectedMonths.map(m => MONTH_NAMES[m - 1]).join('-');
        filename = `Budget_Data_${yearPart}_${monthNamesPart}.xlsx`;
      } else {
        filename = `Budget_Data_${yearPart}.xlsx`;
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Close dialog on success
      onOpenChange(false);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadingMessage = includeAI ? 'Generating AI insights & exporting...' : 'Exporting...';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Budget Data</DialogTitle>
          <DialogDescription>
            Select the year(s) you want to export. Your data will be downloaded as an Excel file with separate sheets for each category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {isLoadingYears ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading available years...</span>
            </div>
          ) : availableYears.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No data available to export
            </div>
          ) : (
            <>
              {/* Year selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Years:</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableYears.map(year => (
                    <label
                      key={year}
                      className="flex items-center space-x-2 p-3 border dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedYears.includes(year)}
                        onChange={() => toggleYear(year)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">{year}</span>
                    </label>
                  ))}
                </div>
                {selectedYears.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedYears.length} year(s) selected
                  </p>
                )}
              </div>

              {/* Month filter toggle */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowMonthFilter(prev => !prev)}
                  className="flex items-center justify-between w-full text-sm font-medium p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>Filter by Months</span>
                  {showMonthFilter ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                {showMonthFilter && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {MONTH_NAMES.map((name, index) => (
                        <label
                          key={index}
                          className="flex items-center space-x-2 p-2 border dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMonths.includes(index + 1)}
                            onChange={() => toggleMonth(index + 1)}
                            className="h-3.5 w-3.5 rounded border-gray-300"
                          />
                          <span>{name.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">
                      Leave empty for full year export
                    </p>
                  </div>
                )}
              </div>

              {/* AI Insights toggle */}
              <div className="space-y-1">
                <label className="flex items-center space-x-2 p-3 border dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeAI}
                    onChange={() => setIncludeAI(prev => !prev)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Include AI Insights</span>
                </label>
                <p className="text-xs text-gray-400 ml-1">
                  AI will analyze your spending patterns and add insights to each month&apos;s sheet
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || selectedYears.length === 0 || isLoadingYears}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">{loadingMessage}</span>
                <span className="sm:hidden">{includeAI ? 'Generating...' : 'Exporting...'}</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
