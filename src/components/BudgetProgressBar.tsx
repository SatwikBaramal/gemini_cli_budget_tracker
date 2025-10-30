import React from 'react';

interface BudgetProgressBarProps {
  income: number;
  spent: number;
  className?: string;
  showLabels?: boolean;
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ 
  income, 
  spent, 
  className = '',
  showLabels = true 
}) => {
  // Safely handle undefined, null, or NaN values
  const safeIncome = Number(income) || 0;
  const safeSpent = Number(spent) || 0;
  
  const spentPercentage = safeIncome > 0 ? Math.min((safeSpent / safeIncome) * 100, 100) : 0;
  const remainingPercentage = Math.max(0, Math.min(100 - spentPercentage, 100));
  
  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'from-green-500 to-green-600';
    if (percentage < 70) return 'from-yellow-500 to-yellow-600';
    if (percentage < 85) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getProgressColor(spentPercentage)} transition-all duration-300`}
          style={{ width: `${remainingPercentage}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1 text-xs text-gray-600">
          <span>{remainingPercentage.toFixed(0)}% left</span>
          <span>{spentPercentage.toFixed(0)}% spent</span>
        </div>
      )}
    </div>
  );
};

export default BudgetProgressBar;

