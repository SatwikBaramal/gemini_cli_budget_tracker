import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Goal } from '@/lib/models/Goal';
import { encrypt, decrypt } from '@/lib/encryption';

// GET: Fetch specific goal
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const { id } = await params;

    const goal = await Goal.findOne({ _id: id, userId }).lean();
    
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Decrypt amounts before returning
    const decryptedGoal = {
      ...goal,
      targetAmount: parseFloat(decrypt(goal.targetAmount.toString())),
      currentAmount: parseFloat(decrypt(goal.currentAmount.toString())),
      contributions: goal.contributions.map((contrib: any) => ({
        ...contrib,
        amount: parseFloat(decrypt(contrib.amount.toString()))
      }))
    };

    return NextResponse.json(decryptedGoal);
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

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

      // Decrypt current amounts to perform validation
      const decryptedCurrentAmount = parseFloat(decrypt(goal.currentAmount.toString()));
      const decryptedTargetAmount = parseFloat(decrypt(goal.targetAmount.toString()));

      // Validate withdrawal doesn't exceed current amount
      if (type === 'withdrawal') {
        if (amount > decryptedCurrentAmount) {
          return NextResponse.json(
            { error: `Cannot withdraw more than available balance (₹${decryptedCurrentAmount})` },
            { status: 400 }
          );
        }
      }

      // Encrypt contribution amount before adding to history
      const encryptedContributionAmount = encrypt(amount.toString());
      
      // Add transaction to history
      goal.contributions.push({ amount: encryptedContributionAmount, date, note, type });
      
      // Update current amount based on transaction type
      let newCurrentAmount = decryptedCurrentAmount;
      if (type === 'addition') {
        newCurrentAmount += amount;
      } else {
        newCurrentAmount -= amount;
      }
      
      // Encrypt and store new current amount
      goal.currentAmount = encrypt(newCurrentAmount.toString());

      // Update status based on new amount
      if (newCurrentAmount >= decryptedTargetAmount && goal.status === 'active') {
        goal.status = 'completed';
      } else if (newCurrentAmount < decryptedTargetAmount && goal.status === 'completed') {
        goal.status = 'active';
      }

      await goal.save();
      
      // Decrypt amounts before returning
      const goalToReturn = {
        ...goal.toObject(),
        targetAmount: decryptedTargetAmount,
        currentAmount: newCurrentAmount,
        contributions: goal.contributions.map((contrib: any) => ({
          ...contrib,
          amount: parseFloat(decrypt(contrib.amount.toString()))
        }))
      };
      
      return NextResponse.json(goalToReturn);
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
      goal.targetAmount = encrypt(targetAmount.toString());
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
    
    // Decrypt amounts before returning
    const goalToReturn = {
      ...goal.toObject(),
      targetAmount: targetAmount !== undefined ? targetAmount : parseFloat(decrypt(goal.targetAmount.toString())),
      currentAmount: parseFloat(decrypt(goal.currentAmount.toString())),
      contributions: goal.contributions.map((contrib: any) => ({
        ...contrib,
        amount: parseFloat(decrypt(contrib.amount.toString()))
      }))
    };
    
    return NextResponse.json(goalToReturn);
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

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

