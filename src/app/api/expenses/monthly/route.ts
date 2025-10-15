import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/lib/models/Expense';

export async function GET(request: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  
  // Get all monthly expenses across all months for the specified year
  const expenses = await Expense.find({ type: 'monthly', year })
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
}
