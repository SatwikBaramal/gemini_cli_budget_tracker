import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/lib/models/Setting';

export async function GET() {
  await connectToDatabase();
  const result = await Setting.findOne({ key: 'yearlyIncome' });
  
  return NextResponse.json(result ? { value: result.value } : { value: '0' }, {
    headers: {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
    }
  });
}

export async function POST(request: Request) {
  await connectToDatabase();
  const { income } = await request.json();
  await Setting.findOneAndUpdate(
    { key: 'yearlyIncome' },
    { value: income.toString() },
    { upsert: true, new: true }
  );
  return NextResponse.json({ income });
}
