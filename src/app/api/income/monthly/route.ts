import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/lib/models/Setting';
import { validateIncome, validateYear } from '@/lib/validation';
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
    
    const result = await Setting.findOne({ userId, key: 'monthlyIncome', year });
    
    // Decrypt the value before returning
    const decryptedValue = result ? decrypt(result.value) : '0';
    
    return NextResponse.json({ value: decryptedValue }, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Error fetching monthly income:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly income' }, { status: 500 });
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
    const { income, year } = await request.json();
    const yearToUse = year || new Date().getFullYear();
    
    // Validate income
    const incomeValidation = validateIncome(income);
    if (!incomeValidation.valid) {
      return NextResponse.json({ error: incomeValidation.error }, { status: 400 });
    }
    
    // Validate year
    const yearValidation = validateYear(yearToUse);
    if (!yearValidation.valid) {
      return NextResponse.json({ error: yearValidation.error }, { status: 400 });
    }
    
    // Encrypt the income value before storing
    const encryptedIncome = encrypt(income.toString());
    
    await Setting.findOneAndUpdate(
      { userId, key: 'monthlyIncome', year: yearToUse },
      { $set: { value: encryptedIncome, userId, key: 'monthlyIncome', year: yearToUse } },
      { upsert: true, new: true }
    );
    return NextResponse.json({ income });
  } catch (error) {
    console.error('Error updating monthly income:', error);
    return NextResponse.json({ error: 'Failed to update monthly income' }, { status: 500 });
  }
}
