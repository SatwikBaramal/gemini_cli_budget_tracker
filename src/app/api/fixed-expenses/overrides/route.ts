import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { FixedExpenseOverride } from '@/lib/models/FixedExpenseOverride';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { fixed_expense_id, month, override_amount, year } = await request.json();
    const yearToUse = year || new Date().getFullYear();
    const date = new Date().toISOString();
    
    // Check if override already exists for this fixed expense, month, and year
    const existing = await FixedExpenseOverride.findOne({
      fixedExpenseId: fixed_expense_id,
      month,
      year: yearToUse
    });
    
    if (existing) {
      // Update existing override
      existing.overrideAmount = override_amount;
      existing.date = date;
      await existing.save();
      
      return NextResponse.json({ 
        id: existing._id, 
        fixed_expense_id, 
        month, 
        override_amount, 
        date,
        year: yearToUse
      });
    } else {
      // Create new override
      const override = await FixedExpenseOverride.create({
        fixedExpenseId: fixed_expense_id,
        month,
        overrideAmount: override_amount,
        date,
        year: yearToUse
      });
      
      return NextResponse.json({ 
        id: override._id, 
        fixed_expense_id, 
        month, 
        override_amount, 
        date,
        year: yearToUse
      });
    }
  } catch (error) {
    console.error('Error creating override:', error);
    return NextResponse.json({ error: 'Failed to create override' }, { status: 500 });
  }
}

