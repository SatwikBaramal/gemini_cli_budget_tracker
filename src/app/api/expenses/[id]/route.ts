import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/lib/models/Expense';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectToDatabase();
  const { id } = await params;
  await Expense.findByIdAndDelete(id);
  return NextResponse.json({ message: `Expense ${id} deleted` });
}
