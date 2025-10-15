import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/lib/models/Expense';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ month: string; id: string }> }
) {
  await connectToDatabase();
  const { month: monthStr, id } = await params;
  const month = parseInt(monthStr);
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

  if (isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
  }

  await Expense.findOneAndDelete({ _id: id, type: 'monthly', month, year });
  
  return NextResponse.json({ success: true });
}

