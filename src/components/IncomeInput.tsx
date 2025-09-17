import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IncomeInputProps {
  yearlyIncome: number;
  setYearlyIncome: (income: number) => void;
}

const IncomeInput: React.FC<IncomeInputProps> = ({ yearlyIncome, setYearlyIncome }) => {
  return (
    <div className="p-4 border-b">
      <Label htmlFor="yearly-income" className="text-lg font-medium">
        Yearly Income (INR)
      </Label>
      <Input
        id="yearly-income"
        type="number"
        placeholder="Enter your yearly income"
        value={yearlyIncome}
        onChange={(e) => setYearlyIncome(Number(e.target.value))}
        className="mt-2"
      />
    </div>
  );
};

export default IncomeInput;