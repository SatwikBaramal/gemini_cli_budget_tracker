import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

// Initialize the database
initDb();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  await db.run('DELETE FROM expenses WHERE id = ?', id);
  return NextResponse.json({ message: `Expense ${id} deleted` });
}
