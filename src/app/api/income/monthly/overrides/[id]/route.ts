import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MonthlyIncomeOverride } from '@/lib/models/MonthlyIncomeOverride';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    
    const override = await MonthlyIncomeOverride.findOne({ _id: id, year });
    
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    
    // Delete with year safety check
    await MonthlyIncomeOverride.findOneAndDelete({ _id: id, year });
    
    // Fetch and return all remaining overrides for the year
    const allOverrides = await MonthlyIncomeOverride.find({ year });
    
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

