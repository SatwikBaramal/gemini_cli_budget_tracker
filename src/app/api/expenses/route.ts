import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/lib/models/Expense';

export async function GET() {
  await connectToDatabase();
  const expenses = await Expense.find({ type: 'yearly' }).lean();
  
  // Map _id to id for frontend compatibility
  const mappedExpenses = expenses.map((expense) => ({
    id: expense._id.toString(),
    name: expense.name,
    amount: expense.amount,
    type: expense.type
  }));
  
  return NextResponse.json(mappedExpenses, {
    headers: {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=60'
    }
  });
}

export async function POST(request: Request) {
  await connectToDatabase();
  const { name, amount } = await request.json();
  const expense = await Expense.create({
    name,
    amount,
    type: 'yearly'
  });
  return NextResponse.json({ id: expense._id.toString(), name, amount });
}
