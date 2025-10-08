import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
  await initDb();
  const db = await getDb();
  // Get all monthly expenses across all months
  const expenses = await db.all("SELECT * FROM expenses WHERE type = 'monthly' ORDER BY month, date DESC");
  
  return NextResponse.json(expenses, {
    headers: {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=60'
    }
  });
}
