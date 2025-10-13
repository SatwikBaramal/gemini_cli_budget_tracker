import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/lib/models/Expense';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ month: string }> }
) {
  await connectToDatabase();
  const { month: monthStr } = await params;
  const month = parseInt(monthStr);
  
  if (isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
  }

  const expenses = await Expense.find({ type: 'monthly', month })
    .sort({ date: -1 })
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
  
  return NextResponse.json(mappedExpenses);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ month: string }> }
) {
  await connectToDatabase();
  const { month: monthStr } = await params;
  const month = parseInt(monthStr);
  
  if (isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
  }

  const { name, amount } = await request.json();
  const date = new Date().toISOString();
  
  const expense = await Expense.create({
    name,
    amount,
    type: 'monthly',
    month,
    date
  });
  
  return NextResponse.json({ 
    id: expense._id.toString(), 
    name, 
    amount, 
    type: 'monthly',
    month,
    date 
  });
}

