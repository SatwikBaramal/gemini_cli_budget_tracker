import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IncomeInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const IncomeInput: React.FC<IncomeInputProps> = ({ label, value, onChange }) => {
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
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 text-sm sm:text-base"
      />
    </div>
  );
};

export default IncomeInput;