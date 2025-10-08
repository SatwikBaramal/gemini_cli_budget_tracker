import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
  await initDb();
  const db = await getDb();
  const result = await db.get("SELECT value FROM settings WHERE key = 'monthlyIncome'");
  
  return NextResponse.json(result || { value: 0 }, {
    headers: {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
    }
  });
}

export async function POST(request: Request) {
  await initDb();
  const { income } = await request.json();
  const db = await getDb();
  await db.run(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('monthlyIncome', ?)",
    income
  );
  return NextResponse.json({ income });
}
