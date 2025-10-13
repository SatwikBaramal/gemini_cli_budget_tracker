import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/lib/models/Expense';

export async function GET() {
  await connectToDatabase();
  // Get all monthly expenses across all months
  const expenses = await Expense.find({ type: 'monthly' })
    .sort({ month: 1, date: -1 })
    .lean();
  
  // Map _id to id for frontend compatibility
  const mappedExpenses = expenses.map((expense) => ({
    id: expense._id.toString(),
    name: expense.name,
    amount: expense.amount,
    type: expense.type,
    month: expense.month,
    date: expense.date
  }));
  
  return NextResponse.json(mappedExpenses, {
    headers: {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=60'
    }
  });
}
