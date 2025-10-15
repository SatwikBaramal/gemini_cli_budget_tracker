import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/lib/models/Expense';

export async function GET(request: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  
  const expenses = await Expense.find({ type: 'yearly', year }).lean();
  
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
}

export async function POST(request: Request) {
  await connectToDatabase();
  const { name, amount, year } = await request.json();
  const yearToUse = year || new Date().getFullYear();
  
  const expense = await Expense.create({
    name,
    amount,
    type: 'yearly',
    year: yearToUse
  });
  
  return NextResponse.json({ 
    id: expense._id.toString(), 
    name, 
    amount,
    type: 'yearly',
    year: yearToUse
  });
}
