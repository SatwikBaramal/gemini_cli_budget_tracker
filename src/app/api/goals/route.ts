import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Goal, IContribution } from '@/lib/models/Goal';
import { encrypt, decrypt } from '@/lib/encryption';

// GET: Fetch all goals for authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: { userId: string; status?: string } = { userId };
    if (status && ['active', 'completed', 'archived'].includes(status)) {
      query.status = status;
    }

    const goals = await Goal.find(query).sort({ createdAt: -1 }).lean();
    
    // Decrypt amounts before returning
    const decryptedGoals = goals.map(goal => ({
      ...goal,
      targetAmount: parseFloat(decrypt(goal.targetAmount.toString())),
      currentAmount: parseFloat(decrypt(goal.currentAmount.toString())),
      contributions: goal.contributions.map((contrib: IContribution) => ({
        ...contrib,
        amount: parseFloat(decrypt(contrib.amount.toString()))
      }))
    }));
    
    return NextResponse.json(decryptedGoals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

// POST: Create new goal
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    const body = await req.json();
    const { name, targetAmount, deadline, monthlySavingsTarget } = body;

    // Validation
    if (!name || !targetAmount || !deadline) {
      return NextResponse.json(
        { error: 'Name, target amount, and deadline are required' },
        { status: 400 }
      );
    }

    if (targetAmount <= 0) {
      return NextResponse.json(
        { error: 'Target amount must be positive' },
        { status: 400 }
      );
    }

    if (new Date(deadline) <= new Date()) {
      return NextResponse.json(
        { error: 'Deadline must be in the future' },
        { status: 400 }
      );
    }

    if (monthlySavingsTarget !== undefined && monthlySavingsTarget < 0) {
      return NextResponse.json(
        { error: 'Monthly savings target cannot be negative' },
        { status: 400 }
      );
    }

    // Encrypt amounts before storing
    const encryptedTargetAmount = encrypt(targetAmount.toString());
    const encryptedCurrentAmount = encrypt('0');

    const newGoal = await Goal.create({
      name,
      targetAmount: encryptedTargetAmount,
      currentAmount: encryptedCurrentAmount,
      deadline,
      monthlySavingsTarget,
      userId,
      status: 'active',
      contributions: [],
    });

    // Decrypt amounts before returning
    const goalToReturn = {
      ...newGoal.toObject(),
      targetAmount,
      currentAmount: 0,
    };

    return NextResponse.json(goalToReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

