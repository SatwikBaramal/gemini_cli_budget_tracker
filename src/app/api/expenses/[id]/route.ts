import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

// Initialize the database
initDb();

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const db = await getDb();
  await db.run('DELETE FROM expenses WHERE id = ?', id);
  return NextResponse.json({ message: `Expense ${id} deleted` });
}
