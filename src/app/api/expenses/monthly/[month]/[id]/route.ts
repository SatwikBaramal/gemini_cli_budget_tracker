import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

// Initialize the database
initDb();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ month: string; id: string }> }
) {
  const { month: monthStr, id: idStr } = await params;
  const month = parseInt(monthStr);
  const id = parseInt(idStr);

  if (isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
  }

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const db = await getDb();
  await db.run(
    "DELETE FROM expenses WHERE id = ? AND type = 'monthly' AND month = ?",
    id,
    month
  );
  
  return NextResponse.json({ success: true });
}

