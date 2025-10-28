import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/lib/models/Expense';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    
    // Get all monthly expenses across all months for the specified year - filtered by userId
    const expenses = await Expense.find({ userId, type: 'monthly', year })
      .sort({ month: 1, date: -1 })
      .lean();
    
    // Map _id to id for frontend compatibility
    const mappedExpenses = expenses.map((expense) => ({
      id: expense._id.toString(),
      name: expense.name,
      amount: expense.amount,
      type: expense.type,
      month: expense.month,
      date: expense.date,
      year: expense.year
    }));
    
    return NextResponse.json(mappedExpenses, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error fetching all monthly expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly expenses' }, { status: 500 });
  }
}
