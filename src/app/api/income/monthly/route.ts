import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

// Initialize the database
initDb();

export async function GET() {
  const db = await getDb();
  const result = await db.get("SELECT value FROM settings WHERE key = 'monthlyIncome'");
  return NextResponse.json(result || { value: 0 });
}

export async function POST(request: Request) {
  const { income } = await request.json();
  const db = await getDb();
  await db.run(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('monthlyIncome', ?)",
    income
  );
  return NextResponse.json({ income });
}
