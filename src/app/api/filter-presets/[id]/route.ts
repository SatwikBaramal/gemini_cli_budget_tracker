import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import { FilterPreset } from '@/lib/models/FilterPreset';

// GET - Get a specific filter preset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();
    const preset = await FilterPreset.findOne({ _id: id, userId });

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    return NextResponse.json(preset);
  } catch (error) {
    console.error('Error fetching filter preset:', error);
    return NextResponse.json({ error: 'Failed to fetch filter preset' }, { status: 500 });
  }
}

// DELETE - Delete a filter preset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();
    const preset = await FilterPreset.findOneAndDelete({ _id: id, userId });

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting filter preset:', error);
    return NextResponse.json({ error: 'Failed to delete filter preset' }, { status: 500 });
  }
}

