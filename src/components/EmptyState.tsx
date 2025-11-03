import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, Target } from 'lucide-react';

interface EmptyStateProps {
  variant: 'expenses' | 'goals' | 'search' | 'monthly-expenses';
  onAction?: () => void;
  actionLabel?: string;
}

const emptyStateConfig = {
  expenses: {
    icon: <div className="text-6xl mb-4">💰</div>,
    title: 'No expenses yet',
    description: 'Start tracking your spending by adding your first expense',
    actionIcon: <Plus className="mr-2 h-4 w-4" />,
    actionLabel: 'Add Expense',
  },
  'monthly-expenses': {
    icon: <div className="text-6xl mb-4">📝</div>,
    title: 'No expenses this month',
    description: 'Track your monthly spending by adding expenses',
    actionIcon: <Plus className="mr-2 h-4 w-4" />,
    actionLabel: 'Add Expense',
  },
  goals: {
    icon: <div className="text-6xl mb-4">🎯</div>,
    title: 'No savings goals',
    description: 'Set financial goals to track your progress and stay motivated',
    actionIcon: <Target className="mr-2 h-4 w-4" />,
    actionLabel: 'Create Goal',
  },
  search: {
    icon: <div className="text-6xl mb-4">🔍</div>,
    title: 'No results found',
    description: 'Try adjusting your search filters or search term',
    actionIcon: <Search className="mr-2 h-4 w-4" />,
    actionLabel: 'Clear Filters',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant,
  onAction,
  actionLabel,
}) => {
  const config = emptyStateConfig[variant];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {config.icon}
      <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
        {config.title}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {config.description}
      </p>
      {onAction && (
        <Button onClick={onAction} size="lg" className="shadow-lg">
          {config.actionIcon}
          {actionLabel || config.actionLabel}
        </Button>
      )}
    </div>
  );
};

