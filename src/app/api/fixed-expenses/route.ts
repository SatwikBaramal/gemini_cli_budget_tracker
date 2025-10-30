import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { FixedExpense } from '@/lib/models/FixedExpense';
import { FixedExpenseOverride } from '@/lib/models/FixedExpenseOverride';
import { validateExpenseName, validateAmount, validateMonthArray, validateYear } from '@/lib/validation';
import { encrypt, decrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    
    const fixedExpenses = await FixedExpense.find({ userId, year }).lean();
    
    // Fetch all overrides for the specified year and user
    const allOverrides = await FixedExpenseOverride.find({ userId, year }).lean();
    
    // Attach overrides to each fixed expense and decrypt amounts
    const parsed = fixedExpenses.map(expense => {
      const overrides = allOverrides.filter(o => 
        o.fixedExpenseId.toString() === expense._id.toString()
      );
      return {
        id: expense._id,
        name: expense.name,
        amount: parseFloat(decrypt(expense.amount.toString())),
        applicable_months: expense.applicableMonths,
        year: expense.year,
        overrides: overrides.map(o => ({
          id: o._id,
          fixed_expense_id: o.fixedExpenseId,
          month: o.month,
          override_amount: parseFloat(decrypt(o.overrideAmount.toString())),
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
    return NextResponse.json({ error: 'Failed to fetch fixed expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const { name, amount, applicable_months, year } = await request.json();
    const yearToUse = year || new Date().getFullYear();
    
    // Validate inputs
    const nameValidation = validateExpenseName(name);
    if (!nameValidation.valid) {
      return NextResponse.json({ error: nameValidation.error }, { status: 400 });
    }
    
    const amountValidation = validateAmount(amount, 'Fixed expense amount');
    if (!amountValidation.valid) {
      return NextResponse.json({ error: amountValidation.error }, { status: 400 });
    }
    
    const monthsValidation = validateMonthArray(applicable_months);
    if (!monthsValidation.valid) {
      return NextResponse.json({ error: monthsValidation.error }, { status: 400 });
    }
    
    const yearValidation = validateYear(yearToUse);
    if (!yearValidation.valid) {
      return NextResponse.json({ error: yearValidation.error }, { status: 400 });
    }
    
    // Encrypt the amount before storing
    const encryptedAmount = encrypt(amount.toString());
    
    const fixedExpense = await FixedExpense.create({
      name,
      amount: encryptedAmount,
      applicableMonths: applicable_months,
      year: yearToUse,
      userId
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

