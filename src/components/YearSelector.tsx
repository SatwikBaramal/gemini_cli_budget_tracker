"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const YearSelector: React.FC<YearSelectorProps> = ({ selectedYear, onYearChange }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2020 + 3 }, (_, i) => 2020 + i);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          {selectedYear}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Year</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 py-4">
          {years.map((year) => (
            <Button
              key={year}
              variant={year === selectedYear ? 'default' : 'outline'}
              onClick={() => {
                onYearChange(year);
                // Close dialog by triggering ESC key
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
              }}
              className="w-full"
            >
              {year}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default YearSelector;

