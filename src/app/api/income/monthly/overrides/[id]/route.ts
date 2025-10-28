import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { MonthlyIncomeOverride } from '@/lib/models/MonthlyIncomeOverride';

export async function GET(
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
    
    const override = await MonthlyIncomeOverride.findOne({ _id: id, userId, year });
    
    if (!override) {
      return NextResponse.json({ error: 'Override not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: override._id,
      month: override.month,
      year: override.year,
      override_amount: override.overrideAmount,
      date: override.date,
    });
  } catch (error) {
    console.error('Error fetching income override:', error);
    return NextResponse.json({ error: 'Failed to fetch income override' }, { status: 500 });
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
    const override = await MonthlyIncomeOverride.findOne({ _id: id, userId, year });
    if (!override) {
      return NextResponse.json({ error: 'Override not found' }, { status: 404 });
    }

    await MonthlyIncomeOverride.findOneAndDelete({ _id: id, userId, year });
    
    // Fetch and return all remaining overrides for the user and year
    const allOverrides = await MonthlyIncomeOverride.find({ userId, year });
    
    return NextResponse.json({
      success: true,
      data: allOverrides.map(override => ({
        id: override._id,
        month: override.month,
        year: override.year,
        override_amount: override.overrideAmount,
        date: override.date,
      }))
    });
  } catch (error) {
    console.error('Error deleting income override:', error);
    return NextResponse.json({ error: 'Failed to delete income override' }, { status: 500 });
  }
}

