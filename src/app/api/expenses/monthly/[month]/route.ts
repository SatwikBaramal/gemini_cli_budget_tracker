import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

// Initialize the database
initDb();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ month: string }> }
) {
  const { month: monthStr } = await params;
  const month = parseInt(monthStr);
  
  if (isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
  }

  const db = await getDb();
  const expenses = await db.all(
    "SELECT * FROM expenses WHERE type = 'monthly' AND month = ? ORDER BY date DESC",
    month
  );
  return NextResponse.json(expenses);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ month: string }> }
) {
  const { month: monthStr } = await params;
  const month = parseInt(monthStr);
  
  if (isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
  }

  const { name, amount } = await request.json();
  const date = new Date().toISOString();
  
  const db = await getDb();
  const result = await db.run(
    "INSERT INTO expenses (name, amount, type, month, date) VALUES (?, ?, 'monthly', ?, ?)",
    name,
    amount,
    month,
    date
  );
  
  return NextResponse.json({ 
    id: result.lastID, 
    name, 
    amount, 
    type: 'monthly',
    month,
    date 
  });
}

