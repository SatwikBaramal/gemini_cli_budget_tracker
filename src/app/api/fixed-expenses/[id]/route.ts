import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { FixedExpense } from '@/lib/models/FixedExpense';
import { FixedExpenseOverride } from '@/lib/models/FixedExpenseOverride';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const { id } = await params;
    const { name, amount, applicable_months, year } = await request.json();
    const yearToUse = year || new Date().getFullYear();
    
    // Verify ownership before update
    const fixedExpense = await FixedExpense.findOne({ _id: id, userId });
    if (!fixedExpense) {
      return NextResponse.json({ error: 'Fixed expense not found' }, { status: 404 });
    }

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    
    // Verify ownership before delete
    const fixedExpense = await FixedExpense.findOne({ _id: id, userId, year });
    if (!fixedExpense) {
      return NextResponse.json({ error: 'Fixed expense not found' }, { status: 404 });
    }

    // Delete the fixed expense
    await FixedExpense.findOneAndDelete({ _id: id, userId, year });
    
    // Delete all related overrides for this user and year
    await FixedExpenseOverride.deleteMany({ userId, fixedExpenseId: id, year });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fixed expense:', error);
    return NextResponse.json({ error: 'Failed to delete fixed expense' }, { status: 500 });
  }
}

