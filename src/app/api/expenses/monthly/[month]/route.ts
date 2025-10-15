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
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  
  if (isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
  }

  const expenses = await Expense.find({ type: 'monthly', month, year })
    .sort({ date: -1 })
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

  const { name, amount, year } = await request.json();
  const yearToUse = year || new Date().getFullYear();
  const date = new Date().toISOString();
  
  const expense = await Expense.create({
    name,
    amount,
    type: 'monthly',
    month,
    date,
    year: yearToUse
  });
  
  return NextResponse.json({ 
    id: expense._id.toString(), 
    name, 
    amount, 
    type: 'monthly',
    month,
    date,
    year: yearToUse
  });
}

