import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    await initDb();
    const { fixed_expense_id, month, override_amount } = await request.json();
    const date = new Date().toISOString();
    
    const db = await getDb();
    
    // Check if override already exists for this fixed expense and month
    const existing = await db.get(
      'SELECT id FROM fixed_expense_overrides WHERE fixed_expense_id = ? AND month = ?',
      fixed_expense_id,
      month
    );
    
    if (existing) {
      // Update existing override
      await db.run(
        'UPDATE fixed_expense_overrides SET override_amount = ?, date = ? WHERE id = ?',
        override_amount,
        date,
        existing.id
      );
      return NextResponse.json({ 
        id: existing.id, 
        fixed_expense_id, 
        month, 
        override_amount, 
        date 
      });
    } else {
      // Create new override
      const result = await db.run(
        'INSERT INTO fixed_expense_overrides (fixed_expense_id, month, override_amount, date) VALUES (?, ?, ?, ?)',
        fixed_expense_id,
        month,
        override_amount,
        date
      );
      return NextResponse.json({ 
        id: result.lastID, 
        fixed_expense_id, 
        month, 
        override_amount, 
        date 
      });
    }
  } catch (error) {
    console.error('Error creating override:', error);
    return NextResponse.json({ error: 'Failed to create override' }, { status: 500 });
  }
}

