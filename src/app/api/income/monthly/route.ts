import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/lib/models/Setting';

export async function GET(request: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  
  const result = await Setting.findOne({ key: 'monthlyIncome', year });
  
  return NextResponse.json(result ? { value: result.value } : { value: '0' }, {
    headers: {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
    }
  });
}

export async function POST(request: Request) {
  await connectToDatabase();
  const { income, year } = await request.json();
  const yearToUse = year || new Date().getFullYear();
  
  await Setting.findOneAndUpdate(
    { key: 'monthlyIncome', year: yearToUse },
    { value: income.toString() },
    { upsert: true, new: true }
  );
  return NextResponse.json({ income });
}
