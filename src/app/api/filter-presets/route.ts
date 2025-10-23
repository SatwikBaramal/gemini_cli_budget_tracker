import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import { FilterPreset } from '@/lib/models/FilterPreset';

// GET - Fetch all filter presets for the current user and year
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    await connectToDatabase();
    const presets = await FilterPreset.find({ userId, year }).sort({ createdAt: -1 });

    return NextResponse.json(presets);
  } catch (error) {
    console.error('Error fetching filter presets:', error);
    return NextResponse.json({ error: 'Failed to fetch filter presets' }, { status: 500 });
  }
}

// POST - Create a new filter preset
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, filters, year } = body;

    if (!name || !filters || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();
    const preset = await FilterPreset.create({
      name,
      userId,
      filters,
      year,
    });

    return NextResponse.json(preset, { status: 201 });
  } catch (error) {
    console.error('Error creating filter preset:', error);
    return NextResponse.json({ error: 'Failed to create filter preset' }, { status: 500 });
  }
}

