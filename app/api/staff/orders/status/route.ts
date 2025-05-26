import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

// Server-side function to update order status
export async function PUT(request: Request) {
  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['pending', 'in-progress', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update order status in database
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, error: null });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
