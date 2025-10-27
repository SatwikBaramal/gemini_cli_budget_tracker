import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { FixedExpenseOverride } from '@/lib/models/FixedExpenseOverride';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    
    const override = await FixedExpenseOverride.findOne({ _id: id, year });
    
    if (!override) {
      return NextResponse.json({ error: 'Override not found' }, { status: 404 });
    }
    
    return NextResponse.json(override);
  } catch (error) {
    console.error('Error fetching override:', error);
    return NextResponse.json({ error: 'Failed to fetch override' }, { status: 500 });
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
    await FixedExpenseOverride.findOneAndDelete({ _id: id, year });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting override:', error);
    return NextResponse.json({ error: 'Failed to delete override' }, { status: 500 });
  }
}

