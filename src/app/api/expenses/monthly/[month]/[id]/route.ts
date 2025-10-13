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

  if (isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
  }

  await Expense.findOneAndDelete({ _id: id, type: 'monthly', month });
  
  return NextResponse.json({ success: true });
}

