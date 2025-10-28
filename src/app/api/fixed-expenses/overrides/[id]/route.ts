import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { FixedExpenseOverride } from '@/lib/models/FixedExpenseOverride';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    
    const override = await FixedExpenseOverride.findOne({ _id: id, userId, year });
    
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    
    // Verify ownership before delete
    const override = await FixedExpenseOverride.findOne({ _id: id, userId, year });
    if (!override) {
      return NextResponse.json({ error: 'Override not found' }, { status: 404 });
    }

    await FixedExpenseOverride.findOneAndDelete({ _id: id, userId, year });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting override:', error);
    return NextResponse.json({ error: 'Failed to delete override' }, { status: 500 });
  }
}

