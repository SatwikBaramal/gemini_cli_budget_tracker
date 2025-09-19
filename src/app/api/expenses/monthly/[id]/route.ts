import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  await db.run('DELETE FROM expenses WHERE id = ?', params.id);
  return NextResponse.json({ message: 'Expense deleted' });
}
