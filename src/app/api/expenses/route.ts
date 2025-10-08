import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
  await initDb();
  const db = await getDb();
  const expenses = await db.all("SELECT * FROM expenses WHERE type = 'yearly'");
  
  return NextResponse.json(expenses, {
    headers: {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=60'
    }
  });
}

export async function POST(request: Request) {
  await initDb();
  const { name, amount } = await request.json();
  const db = await getDb();
  const result = await db.run(
    "INSERT INTO expenses (name, amount, type) VALUES (?, ?, 'yearly')",
    name,
    amount
  );
  return NextResponse.json({ id: result.lastID, name, amount });
}
