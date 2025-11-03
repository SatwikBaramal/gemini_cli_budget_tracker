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
import { Download, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    if (open) {
      fetchAvailableYears();
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

  const handleExport = async () => {
    if (selectedYears.length === 0) {
      setError('Please select at least one year to export');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const yearsParam = selectedYears.join(',');
      const response = await fetch(`/api/export/excel?years=${yearsParam}`);

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
      const filename = selectedYears.length === 1 
        ? `Budget_Data_${selectedYears[0]}.xlsx`
        : `Budget_Data_${Math.min(...selectedYears)}-${Math.max(...selectedYears)}.xlsx`;
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Budget Data</DialogTitle>
          <DialogDescription>
            Select the year(s) you want to export. Your data will be downloaded as an Excel file with separate sheets for each category.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
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
                Exporting...
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

