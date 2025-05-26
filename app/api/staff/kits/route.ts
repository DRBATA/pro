import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

// Server-side function to get hydration kits
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('hydration_kits')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching hydration kits:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hydration kits' },
      { status: 500 }
    );
  }
}
