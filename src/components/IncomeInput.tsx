import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IncomeInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const IncomeInput: React.FC<IncomeInputProps> = ({ label, value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (inputValue === '') {
      onChange(0);
      return;
    }
    
    const numValue = Number(inputValue);
    
    // Validate and clamp the value
    if (!isNaN(numValue)) {
      // Prevent negative values
      if (numValue < 0) {
        onChange(0);
        return;
      }
      
      // Prevent values exceeding max
      if (numValue > 999999999) {
        onChange(999999999);
        return;
      }
      
      onChange(numValue);
    }
  };
  
  return (
    <div className="p-3 sm:p-4 border-b">
      <Label htmlFor="income-input" className="text-base sm:text-lg font-medium">
        {label}
      </Label>
      <Input
        id="income-input"
        type="number"
        placeholder={`Enter your ${label.toLowerCase()}`}
        value={value}
        onChange={handleChange}
        min="0"
        max="999999999"
        className="mt-2 text-sm sm:text-base"
      />
    </div>
  );
};

export default IncomeInput;