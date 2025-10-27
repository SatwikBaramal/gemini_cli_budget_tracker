"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoalCard } from './GoalCard';
import { AddGoalDialog, GoalFormData } from './AddGoalDialog';
import { ManageSavingsDialog, TransactionData } from './ManageSavingsDialog';
import { ContributionHistoryDialog } from './ContributionHistoryDialog';
import { CoinLoadingAnimation } from './CoinLoadingAnimation';

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
    type: 'addition' | 'withdrawal';
  }>;
}

export const GoalsSection: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  
  // Dialog states
  const [addGoalDialogOpen, setAddGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [manageSavingsDialogOpen, setManageSavingsDialogOpen] = useState(false);
  const [selectedGoalForTransaction, setSelectedGoalForTransaction] = useState<Goal | null>(null);
  const [viewHistoryDialogOpen, setViewHistoryDialogOpen] = useState(false);
  const [selectedGoalForHistory, setSelectedGoalForHistory] = useState<Goal | null>(null);

  // Fetch goals
  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const status = showArchived ? 'archived' : 'active';
      const response = await fetch(`/api/goals?status=${status}`);
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  // Handle create/update goal
  const handleSaveGoal = async (goalData: GoalFormData) => {
    try {
      if (editingGoal) {
        // Update existing goal
        const response = await fetch(`/api/goals/${editingGoal._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goalData),
        });

        if (response.ok) {
          const updatedGoal = await response.json();
          setGoals((prev) =>
            prev.map((g) => (g._id === updatedGoal._id ? updatedGoal : g))
          );
          setEditingGoal(null);
        }
      } else {
        // Create new goal
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goalData),
        });

        if (response.ok) {
          const newGoal = await response.json();
          setGoals((prev) => [newGoal, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      throw error;
    }
  };

  // Handle transaction (addition or withdrawal)
  const handleTransaction = async (transaction: TransactionData) => {
    if (!selectedGoalForTransaction) return;

    try {
      const response = await fetch(`/api/goals/${selectedGoalForTransaction._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contribution: transaction }),
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        setGoals((prev) =>
          prev.map((g) => (g._id === updatedGoal._id ? updatedGoal : g))
        );
        setSelectedGoalForTransaction(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to process transaction');
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      throw error;
    }
  };

  // Handle archive goal
  const handleArchiveGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });

      if (response.ok) {
        setGoals((prev) => prev.filter((g) => g._id !== goalId));
      }
    } catch (error) {
      console.error('Error archiving goal:', error);
    }
  };

  // Handle delete goal
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGoals((prev) => prev.filter((g) => g._id !== goalId));
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Filter goals based on showArchived
  const displayedGoals = showArchived
    ? goals.filter((g) => g.status === 'archived')
    : goals.filter((g) => g.status !== 'archived');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <CardTitle className="text-2xl">Savings Goals</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? 'Show Active' : 'Show Archived'}
            </Button>
            <Button onClick={() => setAddGoalDialogOpen(true)}>
              Create New Goal
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <CoinLoadingAnimation />
          </div>
        ) : displayedGoals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {showArchived
                ? 'No archived goals'
                : 'No active goals yet. Create your first savings goal!'}
            </p>
            {!showArchived && (
              <Button onClick={() => setAddGoalDialogOpen(true)}>
                Create Your First Goal
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onAddContribution={(goalId) => {
                  const goal = goals.find((g) => g._id === goalId);
                  if (goal) {
                    setSelectedGoalForTransaction(goal);
                    setManageSavingsDialogOpen(true);
                  }
                }}
                onViewHistory={(goalId) => {
                  const goal = goals.find((g) => g._id === goalId);
                  if (goal) {
                    setSelectedGoalForHistory(goal);
                    setViewHistoryDialogOpen(true);
                  }
                }}
                onEdit={(goalId) => {
                  const goal = goals.find((g) => g._id === goalId);
                  if (goal) {
                    setEditingGoal(goal);
                    setAddGoalDialogOpen(true);
                  }
                }}
                onArchive={handleArchiveGoal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
      <AddGoalDialog
        open={addGoalDialogOpen}
        onOpenChange={(open) => {
          setAddGoalDialogOpen(open);
          if (!open) setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        editGoal={editingGoal}
      />

      <ManageSavingsDialog
        open={manageSavingsDialogOpen}
        onOpenChange={(open) => {
          setManageSavingsDialogOpen(open);
          if (!open) setSelectedGoalForTransaction(null);
        }}
        goalName={selectedGoalForTransaction?.name || ''}
        currentAmount={selectedGoalForTransaction?.currentAmount || 0}
        onSave={handleTransaction}
      />

      <ContributionHistoryDialog
        open={viewHistoryDialogOpen}
        onOpenChange={(open) => {
          setViewHistoryDialogOpen(open);
          if (!open) setSelectedGoalForHistory(null);
        }}
        goalName={selectedGoalForHistory?.name || ''}
        contributions={selectedGoalForHistory?.contributions || []}
      />
    </Card>
  );
};

