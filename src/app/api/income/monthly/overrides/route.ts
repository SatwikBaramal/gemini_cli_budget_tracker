import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { MonthlyIncomeOverride } from '@/lib/models/MonthlyIncomeOverride';

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
    
    const overrides = await MonthlyIncomeOverride.find({ userId, year });
    
    return NextResponse.json(
      overrides.map(override => ({
        id: override._id,
        month: override.month,
        year: override.year,
        override_amount: override.overrideAmount,
        date: override.date,
      })),
      {
        headers: {
          'Cache-Control': 'private, max-age=10'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching income overrides:', error);
    return NextResponse.json({ error: 'Failed to fetch income overrides' }, { status: 500 });
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
    const { month, override_amount, year } = await request.json();
    const yearToUse = year || new Date().getFullYear();
    const date = new Date().toISOString();
    
    // Check if override already exists for this user, month and year
    const existing = await MonthlyIncomeOverride.findOne({
      userId,
      month,
      year: yearToUse
    });
    
    if (existing) {
      // Update existing override
      existing.overrideAmount = override_amount;
      existing.date = date;
      await existing.save();
    } else {
      // Create new override
      await MonthlyIncomeOverride.create({
        userId,
        month,
        overrideAmount: override_amount,
        date,
        year: yearToUse
      });
    }
    
    // Fetch and return all overrides for the user and year
    const allOverrides = await MonthlyIncomeOverride.find({ userId, year: yearToUse });
    
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
    console.error('Error creating income override:', error);
    return NextResponse.json({ error: 'Failed to create income override' }, { status: 500 });
  }
}

