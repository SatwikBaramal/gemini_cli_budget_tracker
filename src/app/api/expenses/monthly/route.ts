import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

// Initialize the database
initDb();

export async function GET() {
  const db = await getDb();
  // Get all monthly expenses across all months
  const expenses = await db.all("SELECT * FROM expenses WHERE type = 'monthly' ORDER BY month, date DESC");
  return NextResponse.json(expenses);
}
