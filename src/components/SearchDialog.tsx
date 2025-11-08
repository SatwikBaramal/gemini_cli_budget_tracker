'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, X, Save, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import SearchResultsDisplay from './SearchResultsDisplay';
import { Skeleton } from '@/components/ui/skeleton';

export interface FilterState {
  searchQuery: string;
  dateRange: {
    start: string;
    end: string;
  };
  amountRange: {
    min: number;
    max: number;
  };
}

interface FilterPreset {
  _id: string;
  name: string;
  filters: {
    searchQuery?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    amountRange?: {
      min: number;
      max: number;
    };
  };
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  date?: string;
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

interface FixedExpenseAPI {
  id: string;
  name: string;
  amount: number;
  applicable_months: number[];
  overrides?: FixedExpenseOverride[];
}

interface SearchDialogProps {
  selectedYear: number;
}

export function SearchDialog({ selectedYear }: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: 0, max: 100000 },
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch yearly, monthly, and fixed expenses
      const [yearlyRes, monthlyRes, fixedRes] = await Promise.all([
        fetch(`/api/expenses?year=${selectedYear}`),
        fetch(`/api/expenses/monthly?year=${selectedYear}`),
        fetch(`/api/fixed-expenses?year=${selectedYear}`)
      ]);

      if (!yearlyRes.ok || !monthlyRes.ok || !fixedRes.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const yearlyExpenses = await yearlyRes.json();
      const monthlyExpenses = await monthlyRes.json();
      const fixedExpenses = await fixedRes.json();

      // Transform fixed expenses into individual expense entries
      const expandedFixedExpenses: Expense[] = fixedExpenses.flatMap((fixed: FixedExpenseAPI) => {
        return fixed.applicable_months.map((month: number) => {
          const override = fixed.overrides?.find((o) => o.month === month);
          const amount = override ? override.override_amount : fixed.amount;
          
          return {
            id: `fixed-${fixed.id}-${month}`,
            name: fixed.name,
            amount: amount,
            month: month,
            type: 'fixed',
            date: override?.date || `${selectedYear}-${String(month).padStart(2, '0')}-01`,
          };
        });
      });

      setExpenses([...yearlyExpenses, ...monthlyExpenses, ...expandedFixedExpenses]);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  const fetchPresets = useCallback(async () => {
    try {
      const response = await fetch(`/api/filter-presets?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setPresets(data);
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
    }
  }, [selectedYear]);

  // Fetch expenses and presets when dialog opens
  useEffect(() => {
    if (open) {
      fetchExpenses();
      fetchPresets();
    }
  }, [open, fetchExpenses, fetchPresets]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const timer = debounceTimerRef.current;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  // Calculate max amount for slider
  const maxAmount = useMemo(() => {
    if (expenses.length === 0) return 100000;
    return Math.max(...expenses.map(exp => exp.amount), 100000);
  }, [expenses]);

  // Filter expenses based on search and filter criteria
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(exp => exp.name.toLowerCase().includes(query));
    }

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      result = result.filter(exp => {
        if (!exp.date) return false;
        const expDate = new Date(exp.date);
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

        if (startDate && expDate < startDate) return false;
        if (endDate && expDate > endDate) return false;
        return true;
      });
    }

    // Apply amount range filter
    if (filters.amountRange.min > 0 || filters.amountRange.max < maxAmount) {
      result = result.filter(exp => 
        exp.amount >= filters.amountRange.min && exp.amount <= filters.amountRange.max
      );
    }

    return result;
  }, [expenses, filters, maxAmount]);

  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, searchQuery: value });
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = { ...filters.dateRange, [field]: value };
    
    if (newDateRange.start && newDateRange.end) {
      const startDate = new Date(newDateRange.start);
      const endDate = new Date(newDateRange.end);
      
      if (startDate > endDate) {
        toast.error('Start date must be before or equal to end date');
        return;
      }
    }
    
    setFilters({ ...filters, dateRange: newDateRange });
  };

  const handleAmountChange = (field: 'min' | 'max', value: number) => {
    const newAmountRange = { ...filters.amountRange, [field]: value };
    
    if (newAmountRange.min > newAmountRange.max) {
      toast.error('Minimum amount must be less than or equal to maximum amount');
      return;
    }
    
    setFilters({ ...filters, amountRange: newAmountRange });
  };

  const clearAllFilters = () => {
    setFilters({
      searchQuery: '',
      dateRange: { start: '', end: '' },
      amountRange: { min: 0, max: maxAmount },
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.searchQuery !== '' ||
      filters.dateRange.start !== '' ||
      filters.dateRange.end !== '' ||
      filters.amountRange.min !== 0 ||
      filters.amountRange.max !== maxAmount
    );
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;

    try {
      const response = await fetch('/api/filter-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: presetName,
          filters: {
            searchQuery: filters.searchQuery || undefined,
            dateRange: filters.dateRange.start || filters.dateRange.end 
              ? filters.dateRange 
              : undefined,
            amountRange: filters.amountRange.min !== 0 || filters.amountRange.max !== maxAmount
              ? filters.amountRange
              : undefined,
          },
          year: selectedYear,
        }),
      });

      if (response.ok) {
        const newPreset = await response.json();
        setPresets([newPreset, ...presets]);
        setPresetName('');
        setIsSaveDialogOpen(false);
        toast.success('Filter preset saved');
      }
    } catch (error) {
      console.error('Error saving preset:', error);
      toast.error('Failed to save preset');
    }
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    setFilters({
      searchQuery: preset.filters.searchQuery || '',
      dateRange: preset.filters.dateRange || { start: '', end: '' },
      amountRange: preset.filters.amountRange || { min: 0, max: maxAmount },
    });
    toast.success(`Loaded preset: ${preset.name}`);
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      const response = await fetch(`/api/filter-presets/${presetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPresets(presets.filter(p => p._id !== presetId));
        toast.success('Preset deleted');
      }
    } catch (error) {
      console.error('Error deleting preset:', error);
      toast.error('Failed to delete preset');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent border-white text-white hover:bg-gray-700 hover:text-white px-1.5 py-1.5 md:px-3 md:py-2 h-8 md:h-9"
        >
          <Search className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
          <span className="hidden md:inline">Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Expenses
            {hasActiveFilters() && (
              <span className="text-sm font-normal text-blue-600">(Active)</span>
            )}
          </DialogTitle>
          <DialogDescription>
            Search and filter your expenses for {selectedYear}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-12 w-full" />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Filter Controls */}
              <div className="space-y-4 border-b pb-4">
                {/* Action Buttons */}
                <div className="flex gap-2">
                  {hasActiveFilters() && (
                    <Button variant="outline" size="sm" onClick={clearAllFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                  <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={!hasActiveFilters()}>
                        <Save className="h-4 w-4 mr-1" />
                        Save Preset
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Filter Preset</DialogTitle>
                        <DialogDescription>
                          Give your filter preset a name so you can quickly apply it later.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="preset-name">Preset Name</Label>
                          <Input
                            id="preset-name"
                            placeholder="e.g., High Value Expenses"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSavePreset()}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
                          Save
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Search Input */}
                <div>
                  <Label htmlFor="search">Search by Name</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search expenses..."
                      value={filters.searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date-start">Start Date</Label>
                    <Input
                      id="date-start"
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => handleDateChange('start', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-end">End Date</Label>
                    <Input
                      id="date-end"
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => handleDateChange('end', e.target.value)}
                    />
                  </div>
                </div>

                {/* Amount Range */}
                <div className="space-y-2">
                  <Label>Amount Range: ₹{filters.amountRange.min.toLocaleString('en-IN')} - ₹{filters.amountRange.max.toLocaleString('en-IN')}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount-min" className="text-xs text-gray-600">Min Amount</Label>
                      <Input
                        id="amount-min"
                        type="range"
                        min="0"
                        max={maxAmount}
                        step="100"
                        value={filters.amountRange.min}
                        onChange={(e) => handleAmountChange('min', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount-max" className="text-xs text-gray-600">Max Amount</Label>
                      <Input
                        id="amount-max"
                        type="range"
                        min="0"
                        max={maxAmount}
                        step="100"
                        value={filters.amountRange.max}
                        onChange={(e) => handleAmountChange('max', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Saved Presets */}
                {presets.length > 0 && (
                  <div>
                    <Label>Saved Presets</Label>
                    <div className="space-y-2 mt-2">
                      {presets.map((preset) => (
                        <div
                          key={preset._id}
                          className="flex justify-between items-center p-3 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <button
                            onClick={() => handleLoadPreset(preset)}
                            className="flex-1 text-left text-sm font-medium"
                          >
                            {preset.name}
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePreset(preset._id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Results ({filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense' : 'expenses'})
                </h3>
                <SearchResultsDisplay
                  expenses={filteredExpenses}
                  title=""
                  showMonth={true}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

