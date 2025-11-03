import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/lib/models/Setting';

// GET - Retrieve user's theme preference
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ theme: 'light' }, { status: 200 });
    }

    await connectToDatabase();

    const setting = await Setting.findOne({
      userId: session.user.id,
      key: 'theme',
      year: 0, // Use year 0 for global settings like theme
    });

    return NextResponse.json({ theme: setting?.value || 'light' });
  } catch (error) {
    console.error('Error fetching theme preference:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme preference' },
      { status: 500 }
    );
  }
}

// POST - Save user's theme preference
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { theme } = await request.json();

    if (!['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    await Setting.findOneAndUpdate(
      {
        userId: session.user.id,
        key: 'theme',
        year: 0, // Use year 0 for global settings
      },
      {
        userId: session.user.id,
        key: 'theme',
        value: theme,
        year: 0,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, theme });
  } catch (error) {
    console.error('Error saving theme preference:', error);
    return NextResponse.json(
      { error: 'Failed to save theme preference' },
      { status: 500 }
    );
  }
}

