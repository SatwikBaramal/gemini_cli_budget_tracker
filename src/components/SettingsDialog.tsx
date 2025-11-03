'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';

interface SettingsDialogProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export function SettingsDialog({ selectedYear, onYearChange }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [yearlyIncome, setYearlyIncome] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [yearInput, setYearInput] = useState(selectedYear);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchIncomeData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch yearly income
      const yearlyRes = await fetch(`/api/income?year=${selectedYear}`);
      if (yearlyRes.ok) {
        const yearlyData = await yearlyRes.json();
        setYearlyIncome(Number(yearlyData.value));
      }

      // Fetch monthly income
      const monthlyRes = await fetch(`/api/income/monthly?year=${selectedYear}`);
      if (monthlyRes.ok) {
        const monthlyData = await monthlyRes.json();
        setMonthlyIncome(Number(monthlyData.value));
      }
    } catch (error) {
      console.error('Error fetching income data:', error);
      toast.error('Failed to load income data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  // Fetch income data when dialog opens
  useEffect(() => {
    if (open) {
      fetchIncomeData();
    }
  }, [open, fetchIncomeData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update year if changed
      if (yearInput !== selectedYear) {
        onYearChange(yearInput);
      }

      // Save yearly income
      const yearlyRes = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ income: yearlyIncome, year: yearInput }),
      });

      if (!yearlyRes.ok) {
        throw new Error('Failed to save yearly income');
      }

      // Save monthly income
      const monthlyRes = await fetch('/api/income/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ income: monthlyIncome, year: yearInput }),
      });

      if (!monthlyRes.ok) {
        throw new Error('Failed to save monthly income');
      }

      toast.success('Settings saved successfully');
      setOpen(false);
      
      // If year changed, reload the page to update all data
      if (yearInput !== selectedYear) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent border-white text-white hover:bg-gray-700 hover:text-white px-1.5 py-1.5 md:px-3 md:py-2 h-8 md:h-9"
        >
          <Settings className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
          <span className="hidden md:inline">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your year selection and income settings.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {/* Year Selector */}
            <div className="grid gap-2">
              <Label htmlFor="year">Year</Label>
              <select
                id="year"
                value={yearInput}
                onChange={(e) => setYearInput(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {generateYearOptions().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Yearly Income */}
            <div className="grid gap-2">
              <Label htmlFor="yearly-income">Yearly Income (₹)</Label>
              <Input
                id="yearly-income"
                type="number"
                placeholder="e.g., 500000"
                value={yearlyIncome}
                onChange={(e) => setYearlyIncome(Number(e.target.value))}
                min="0"
                max="999999999"
              />
            </div>

            {/* Monthly Income */}
            <div className="grid gap-2">
              <Label htmlFor="monthly-income">Monthly Income (₹)</Label>
              <Input
                id="monthly-income"
                type="number"
                placeholder="e.g., 40000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                min="0"
                max="999999999"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

