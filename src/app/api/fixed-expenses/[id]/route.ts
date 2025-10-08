import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const { name, amount, applicable_months } = await request.json();
    
    const db = await getDb();
    await db.run(
      'UPDATE fixed_expenses SET name = ?, amount = ?, applicable_months = ? WHERE id = ?',
      name,
      amount,
      JSON.stringify(applicable_months),
      id
    );
    
    return NextResponse.json({ 
      id: parseInt(id), 
      name, 
      amount, 
      applicable_months 
    });
  } catch (error) {
    console.error('Error updating fixed expense:', error);
    return NextResponse.json({ error: 'Failed to update fixed expense' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    
    const db = await getDb();
    await db.run('DELETE FROM fixed_expenses WHERE id = ?', id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fixed expense:', error);
    return NextResponse.json({ error: 'Failed to delete fixed expense' }, { status: 500 });
  }
}

