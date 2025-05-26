import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

// Server-side function to get orders
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        kit_id,
        status,
        timestamp,
        location,
        users (name)
      `)
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Transform data for client
    const orders = data.map(order => ({
      id: order.id,
      userId: order.user_id,
      userName: order.users?.name || 'Unknown User',
      kitId: order.kit_id,
      status: order.status,
      timestamp: order.timestamp,
      location: order.location || 'Unknown'
    }));

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
