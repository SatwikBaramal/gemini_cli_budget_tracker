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
    
    const expenses = await Expense.find({ userId, type: 'yearly', year }).lean();
    
    // Map _id to id for frontend compatibility
    const mappedExpenses = expenses.map((expense) => ({
      id: expense._id.toString(),
      name: expense.name,
      amount: expense.amount,
      type: expense.type,
      year: expense.year
    }));
    
    return NextResponse.json(mappedExpenses, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const { name, amount, year } = await request.json();
    const yearToUse = year || new Date().getFullYear();
    
    const expense = await Expense.create({
      name,
      amount,
      type: 'yearly',
      year: yearToUse,
      userId
    });
    
    return NextResponse.json({ 
      id: expense._id.toString(), 
      name, 
      amount,
      type: 'yearly',
      year: yearToUse
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
