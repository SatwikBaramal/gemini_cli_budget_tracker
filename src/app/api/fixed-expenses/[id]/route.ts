import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { FixedExpense } from '@/lib/models/FixedExpense';
import { FixedExpenseOverride } from '@/lib/models/FixedExpenseOverride';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { name, amount, applicable_months, year } = await request.json();
    const yearToUse = year || new Date().getFullYear();
    
    await FixedExpense.findByIdAndUpdate(id, {
      name,
      amount,
      applicableMonths: applicable_months,
      year: yearToUse
    });
    
    return NextResponse.json({ 
      id, 
      name, 
      amount, 
      applicable_months,
      year: yearToUse
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
    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    
    // Delete the fixed expense (with year safety check)
    await FixedExpense.findOneAndDelete({ _id: id, year });
    
    // Delete all related overrides for this year
    await FixedExpenseOverride.deleteMany({ fixedExpenseId: id, year });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fixed expense:', error);
    return NextResponse.json({ error: 'Failed to delete fixed expense' }, { status: 500 });
  }
}

