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
    const { name, amount, applicable_months } = await request.json();
    
    await FixedExpense.findByIdAndUpdate(id, {
      name,
      amount,
      applicableMonths: applicable_months
    });
    
    return NextResponse.json({ 
      id, 
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
    await connectToDatabase();
    const { id } = await params;
    
    // Delete the fixed expense
    await FixedExpense.findByIdAndDelete(id);
    
    // Delete all related overrides
    await FixedExpenseOverride.deleteMany({ fixedExpenseId: id });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fixed expense:', error);
    return NextResponse.json({ error: 'Failed to delete fixed expense' }, { status: 500 });
  }
}

