import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const db = await getDb();
    const fixedExpenses = await db.all('SELECT * FROM fixed_expenses');
    
    // Fetch all overrides
    const allOverrides = await db.all('SELECT * FROM fixed_expense_overrides');
    
    // Parse the JSON string for applicable_months and attach overrides
    const parsed = fixedExpenses.map(expense => {
      const overrides = allOverrides.filter(o => o.fixed_expense_id === expense.id);
      return {
        ...expense,
        applicable_months: JSON.parse(expense.applicable_months),
        overrides: overrides
      };
    });
    
    return NextResponse.json(parsed, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=120'
      }
    });
  } catch (error) {
    console.error('Error fetching fixed expenses:', error);
    // Return empty array if table doesn't exist yet or other error
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const { name, amount, applicable_months } = await request.json();
    
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO fixed_expenses (name, amount, applicable_months) VALUES (?, ?, ?)',
      name,
      amount,
      JSON.stringify(applicable_months)
    );
    
    return NextResponse.json({ 
      id: result.lastID, 
      name, 
      amount, 
      applicable_months 
    });
  } catch (error) {
    console.error('Error creating fixed expense:', error);
    return NextResponse.json({ error: 'Failed to create fixed expense' }, { status: 500 });
  }
}

