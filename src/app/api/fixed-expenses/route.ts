import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { FixedExpense } from '@/lib/models/FixedExpense';
import { FixedExpenseOverride } from '@/lib/models/FixedExpenseOverride';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    
    const fixedExpenses = await FixedExpense.find({ year }).lean();
    
    // Fetch all overrides for the specified year
    const allOverrides = await FixedExpenseOverride.find({ year }).lean();
    
    // Attach overrides to each fixed expense
    const parsed = fixedExpenses.map(expense => {
      const overrides = allOverrides.filter(o => 
        o.fixedExpenseId.toString() === expense._id.toString()
      );
      return {
        id: expense._id,
        name: expense.name,
        amount: expense.amount,
        applicable_months: expense.applicableMonths,
        year: expense.year,
        overrides: overrides.map(o => ({
          id: o._id,
          fixed_expense_id: o.fixedExpenseId,
          month: o.month,
          override_amount: o.overrideAmount,
          date: o.date,
          year: o.year
        }))
      };
    });
    
    return NextResponse.json(parsed, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=120'
      }
    });
  } catch (error) {
    console.error('Error fetching fixed expenses:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { name, amount, applicable_months, year } = await request.json();
    const yearToUse = year || new Date().getFullYear();
    
    const fixedExpense = await FixedExpense.create({
      name,
      amount,
      applicableMonths: applicable_months,
      year: yearToUse
    });
    
    return NextResponse.json({ 
      id: fixedExpense._id, 
      name, 
      amount, 
      applicable_months,
      year: yearToUse
    });
  } catch (error) {
    console.error('Error creating fixed expense:', error);
    return NextResponse.json({ error: 'Failed to create fixed expense' }, { status: 500 });
  }
}

