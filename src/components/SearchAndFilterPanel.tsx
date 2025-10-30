"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, X, Save, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';

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

interface SearchAndFilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
  year: number;
  maxAmount?: number;
}

const SearchAndFilterPanel: React.FC<SearchAndFilterPanelProps> = ({
  onFilterChange,
  initialFilters,
  year,
  maxAmount = 100000,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: initialFilters?.searchQuery || '',
    dateRange: initialFilters?.dateRange || { start: '', end: '' },
    amountRange: initialFilters?.amountRange || { min: 0, max: maxAmount },
  });

  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch presets
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await fetch(`/api/filter-presets?year=${year}`);
        if (response.ok) {
          const data = await response.json();
          setPresets(data);
        }
      } catch (error) {
        console.error('Error fetching presets:', error);
      }
    };
    fetchPresets();
  }, [year]);

  // Debounced filter change
  const debouncedFilterChange = useCallback(
    (newFilters: FilterState) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onFilterChange(newFilters);
      }, 300);
    },
    [onFilterChange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, searchQuery: value };
    setFilters(newFilters);
    debouncedFilterChange(newFilters);
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = { ...filters.dateRange, [field]: value };
    
    // Validate date range if both dates are provided
    if (newDateRange.start && newDateRange.end) {
      const startDate = new Date(newDateRange.start);
      const endDate = new Date(newDateRange.end);
      
      if (startDate > endDate) {
        toast.error('Start date must be before or equal to end date');
        return;
      }
    }
    
    const newFilters = {
      ...filters,
      dateRange: newDateRange,
    };
    setFilters(newFilters);
    debouncedFilterChange(newFilters);
  };

  const handleAmountChange = (field: 'min' | 'max', value: number) => {
    const newAmountRange = { ...filters.amountRange, [field]: value };
    
    // Validate amount range
    if (newAmountRange.min > newAmountRange.max) {
      toast.error('Minimum amount must be less than or equal to maximum amount');
      return;
    }
    
    const newFilters = {
      ...filters,
      amountRange: newAmountRange,
    };
    setFilters(newFilters);
    debouncedFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      searchQuery: '',
      dateRange: { start: '', end: '' },
      amountRange: { min: 0, max: maxAmount },
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
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
          year,
        }),
      });

      if (response.ok) {
        const newPreset = await response.json();
        setPresets([newPreset, ...presets]);
        setPresetName('');
        setIsSaveDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving preset:', error);
    }
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    const loadedFilters: FilterState = {
      searchQuery: preset.filters.searchQuery || '',
      dateRange: preset.filters.dateRange || { start: '', end: '' },
      amountRange: preset.filters.amountRange || { min: 0, max: maxAmount },
    };
    setFilters(loadedFilters);
    onFilterChange(loadedFilters);
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      const response = await fetch(`/api/filter-presets/${presetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPresets(presets.filter(p => p._id !== presetId));
      }
    } catch (error) {
      console.error('Error deleting preset:', error);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            Search & Filter
            {hasActiveFilters() && (
              <span className="text-xs sm:text-sm font-normal text-blue-600">(Active)</span>
            )}
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {hasActiveFilters() && (
              <Button variant="outline" size="sm" onClick={clearAllFilters} className="w-full sm:w-auto">
                <X className="h-4 w-4 sm:mr-1" />
                <span className="ml-1">Clear All</span>
              </Button>
            )}
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!hasActiveFilters()} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 sm:mr-1" />
                  <span className="ml-1">Save Preset</span>
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
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Amount Range Slider */}
        <div className="space-y-2">
          <Label>Amount Range: ₹{filters.amountRange.min.toLocaleString('en-IN')} - ₹{filters.amountRange.max.toLocaleString('en-IN')}</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="flex justify-between items-center p-2 sm:p-3 border rounded-md bg-gray-50 hover:bg-gray-100"
                >
                  <button
                    onClick={() => handleLoadPreset(preset)}
                    className="flex-1 text-left text-xs sm:text-sm font-medium"
                  >
                    {preset.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePreset(preset._id)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchAndFilterPanel;

