import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { MonthlyIncomeOverride } from '@/lib/models/MonthlyIncomeOverride';
import { validateMonth, validateAmount, validateYear } from '@/lib/validation';
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
    
    const overrides = await MonthlyIncomeOverride.find({ userId, year });
    
    // Decrypt override amounts before returning
    return NextResponse.json(
      overrides.map(override => ({
        id: override._id,
        month: override.month,
        year: override.year,
        override_amount: parseFloat(decrypt(override.overrideAmount.toString())),
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
    
    // Validate inputs
    const monthValidation = validateMonth(month);
    if (!monthValidation.valid) {
      return NextResponse.json({ error: monthValidation.error }, { status: 400 });
    }
    
    const amountValidation = validateAmount(override_amount, 'Override amount');
    if (!amountValidation.valid) {
      return NextResponse.json({ error: amountValidation.error }, { status: 400 });
    }
    
    const yearValidation = validateYear(yearToUse);
    if (!yearValidation.valid) {
      return NextResponse.json({ error: yearValidation.error }, { status: 400 });
    }
    
    // Check if override already exists for this user, month and year
    const existing = await MonthlyIncomeOverride.findOne({
      userId,
      month,
      year: yearToUse
    });
    
    // Encrypt the override amount before storing
    const encryptedAmount = encrypt(override_amount.toString());
    
    if (existing) {
      // Update existing override
      existing.overrideAmount = encryptedAmount;
      existing.date = date;
      await existing.save();
    } else {
      // Create new override
      await MonthlyIncomeOverride.create({
        userId,
        month,
        overrideAmount: encryptedAmount,
        date,
        year: yearToUse
      });
    }
    
    // Fetch and return all overrides for the user and year
    const allOverrides = await MonthlyIncomeOverride.find({ userId, year: yearToUse });
    
    // Decrypt override amounts before returning
    return NextResponse.json({
      success: true,
      data: allOverrides.map(override => ({
        id: override._id,
        month: override.month,
        year: override.year,
        override_amount: parseFloat(decrypt(override.overrideAmount.toString())),
        date: override.date,
      }))
    });
  } catch (error) {
    console.error('Error creating income override:', error);
    return NextResponse.json({ error: 'Failed to create income override' }, { status: 500 });
  }
}

