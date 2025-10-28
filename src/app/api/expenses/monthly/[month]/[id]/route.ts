import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/lib/models/Expense';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ month: string; id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const { month: monthStr, id } = await params;
    const month = parseInt(monthStr);
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
    }

    const expense = await Expense.findOne({ _id: id, userId, type: 'monthly', month, year });
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await Expense.findOneAndDelete({ _id: id, userId, type: 'monthly', month, year });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting monthly expense:', error);
    return NextResponse.json({ error: 'Failed to delete monthly expense' }, { status: 500 });
  }
}

