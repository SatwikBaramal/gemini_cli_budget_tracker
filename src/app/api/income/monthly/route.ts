import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/lib/models/Setting';

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
    
    return NextResponse.json(result ? { value: result.value } : { value: '0' }, {
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
    
    await Setting.findOneAndUpdate(
      { userId, key: 'monthlyIncome', year: yearToUse },
      { $set: { value: income.toString(), userId, key: 'monthlyIncome', year: yearToUse } },
      { upsert: true, new: true }
    );
    return NextResponse.json({ income });
  } catch (error) {
    console.error('Error updating monthly income:', error);
    return NextResponse.json({ error: 'Failed to update monthly income' }, { status: 500 });
  }
}
