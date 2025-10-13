import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { FixedExpense } from '@/lib/models/FixedExpense';
import { FixedExpenseOverride } from '@/lib/models/FixedExpenseOverride';

export async function GET() {
  try {
    await connectToDatabase();
    const fixedExpenses = await FixedExpense.find().lean();
    
    // Fetch all overrides
    const allOverrides = await FixedExpenseOverride.find().lean();
    
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
        overrides: overrides.map(o => ({
          id: o._id,
          fixed_expense_id: o.fixedExpenseId,
          month: o.month,
          override_amount: o.overrideAmount,
          date: o.date
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
    const { name, amount, applicable_months } = await request.json();
    
    const fixedExpense = await FixedExpense.create({
      name,
      amount,
      applicableMonths: applicable_months
    });
    
    return NextResponse.json({ 
      id: fixedExpense._id, 
      name, 
      amount, 
      applicable_months 
    });
  } catch (error) {
    console.error('Error creating fixed expense:', error);
    return NextResponse.json({ error: 'Failed to create fixed expense' }, { status: 500 });
  }
}

