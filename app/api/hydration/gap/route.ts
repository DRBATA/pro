import { NextResponse } from 'next/server';
import { getUserHydrationGap } from '@/lib/server-actions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const hydrationData = await getUserHydrationGap(userId);
    return NextResponse.json(hydrationData);
  } catch (error: any) {
    console.error('Error fetching hydration gap:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hydration data' },
      { status: 500 }
    );
  }
}
