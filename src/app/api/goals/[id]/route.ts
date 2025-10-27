import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Goal } from '@/lib/models/Goal';

// GET: Fetch specific goal
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const goal = await Goal.findOne({ _id: id, userId });
    
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

// PATCH: Update goal or add contribution
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const goal = await Goal.findOne({ _id: id, userId });
    
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check if this is a contribution (addition or withdrawal)
    if (body.contribution) {
      const { amount, date, note, type } = body.contribution;

      // Reject modifications to archived goals
      if (goal.status === 'archived') {
        return NextResponse.json(
          { error: 'Cannot modify archived goals' },
          { status: 400 }
        );
      }

      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be positive' },
          { status: 400 }
        );
      }

      if (!date) {
        return NextResponse.json(
          { error: 'Date is required' },
          { status: 400 }
        );
      }

      if (!type || !['addition', 'withdrawal'].includes(type)) {
        return NextResponse.json(
          { error: 'Transaction type must be "addition" or "withdrawal"' },
          { status: 400 }
        );
      }

      // Validate withdrawal doesn't exceed current amount
      if (type === 'withdrawal') {
        if (amount > goal.currentAmount) {
          return NextResponse.json(
            { error: `Cannot withdraw more than available balance (₹${goal.currentAmount})` },
            { status: 400 }
          );
        }
      }

      // Add transaction to history
      goal.contributions.push({ amount, date, note, type });
      
      // Update current amount based on transaction type
      if (type === 'addition') {
        goal.currentAmount += amount;
      } else {
        goal.currentAmount -= amount;
      }

      // Update status based on new amount
      if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
        goal.status = 'completed';
      } else if (goal.currentAmount < goal.targetAmount && goal.status === 'completed') {
        goal.status = 'active';
      }

      await goal.save();
      return NextResponse.json(goal);
    }

    // Otherwise, update goal details
    const { name, targetAmount, deadline, monthlySavingsTarget, status } = body;

    if (name !== undefined) goal.name = name;
    if (targetAmount !== undefined) {
      if (targetAmount <= 0) {
        return NextResponse.json(
          { error: 'Target amount must be positive' },
          { status: 400 }
        );
      }
      goal.targetAmount = targetAmount;
    }
    if (deadline !== undefined) {
      if (new Date(deadline) <= new Date() && status !== 'archived') {
        return NextResponse.json(
          { error: 'Deadline must be in the future for active goals' },
          { status: 400 }
        );
      }
      goal.deadline = deadline;
    }
    if (monthlySavingsTarget !== undefined) {
      if (monthlySavingsTarget < 0) {
        return NextResponse.json(
          { error: 'Monthly savings target cannot be negative' },
          { status: 400 }
        );
      }
      goal.monthlySavingsTarget = monthlySavingsTarget;
    }
    if (status !== undefined && ['active', 'completed', 'archived'].includes(status)) {
      goal.status = status;
    }

    await goal.save();
    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

// DELETE: Delete goal permanently
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const result = await Goal.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}

