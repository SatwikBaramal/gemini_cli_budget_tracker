import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    
    const db = await getDb();
    await db.run('DELETE FROM fixed_expense_overrides WHERE id = ?', id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting override:', error);
    return NextResponse.json({ error: 'Failed to delete override' }, { status: 500 });
  }
}

