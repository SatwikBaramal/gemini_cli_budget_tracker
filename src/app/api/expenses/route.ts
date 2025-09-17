import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

// Initialize the database
initDb();

export async function GET() {
  const db = await getDb();
  const expenses = await db.all('SELECT * FROM expenses');
  return NextResponse.json(expenses);
}

export async function POST(request: Request) {
  const { name, amount } = await request.json();
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO expenses (name, amount) VALUES (?, ?)',
    name,
    amount
  );
  return NextResponse.json({ id: result.lastID, name, amount });
}
