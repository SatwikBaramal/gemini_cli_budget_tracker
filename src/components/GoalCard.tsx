import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';

interface Goal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  monthlySavingsTarget?: number;
  status: 'active' | 'completed' | 'archived';
  contributions: Array<{
    amount: number;
    date: string;
    note?: string;
  }>;
}

interface GoalCardProps {
  goal: Goal;
  onAddContribution: (goalId: string) => void;
  onViewHistory: (goalId: string) => void;
  onEdit: (goalId: string) => void;
  onArchive: (goalId: string) => void;
  onDelete: (goalId: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onAddContribution,
  onViewHistory,
  onEdit,
  onArchive,
  onDelete,
}) => {
  // Calculate progress percentage
  const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

  // Calculate days until deadline
  const calculateDaysRemaining = () => {
    const today = new Date();
    const deadlineDate = new Date(goal.deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining();

  // Determine status display
  const getStatusBadge = () => {
    if (goal.status === 'completed') {
      return <Badge className="bg-green-500">Completed</Badge>;
    }
    if (goal.status === 'archived') {
      return <Badge variant="secondary">Archived</Badge>;
    }
    if (daysRemaining < 0) {
      return <Badge className="bg-red-500">Overdue by {Math.abs(daysRemaining)} days</Badge>;
    }
    return null;
  };

  // Determine progress bar color
  const getProgressColor = () => {
    if (goal.status === 'completed' || progressPercentage >= 100) {
      return '#22c55e'; // green-500
    }
    if (daysRemaining < 0) {
      return '#ef4444'; // red-500
    }
    if (daysRemaining < 30) {
      return '#eab308'; // yellow-500
    }
    return '#3b82f6'; // blue-500
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{goal.name}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target and Current Amount */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold">
              {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
            </span>
            <span className="text-gray-600">{progressPercentage.toFixed(1)}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: getProgressColor(),
              }}
            />
          </div>
        </div>

        {/* Deadline Display */}
        <div className="text-sm">
          <span className="text-gray-600">Deadline: </span>
          <span className="font-medium">{formatDate(goal.deadline)}</span>
          {goal.status === 'active' && daysRemaining >= 0 && (
            <span className="ml-2 text-gray-500">({daysRemaining} days remaining)</span>
          )}
        </div>

        {/* Monthly Savings Target */}
        {goal.monthlySavingsTarget && goal.monthlySavingsTarget > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Monthly Target: {formatCurrency(goal.monthlySavingsTarget)}
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {goal.status === 'active' && (
            <Button
              size="sm"
              onClick={() => onAddContribution(goal._id)}
              className="flex-1 min-w-[120px]"
            >
              Add Savings
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewHistory(goal._id)}
            className="flex-1 min-w-[120px]"
          >
            View History
          </Button>
          {goal.status !== 'archived' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(goal._id)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onArchive(goal._id)}
              >
                Archive
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(goal._id)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

