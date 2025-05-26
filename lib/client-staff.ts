"use client"

import { Order, HydrationKit } from "./types/database.types"

// Client-safe function to get orders
export async function getClientOrders(): Promise<Order[]> {
  try {
    const response = await fetch('/api/staff/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// Client-safe function to get hydration kits
export async function getClientHydrationKits(): Promise<HydrationKit[]> {
  try {
    const response = await fetch('/api/staff/kits', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch hydration kits');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching hydration kits:', error);
    return [];
  }
}

// Client-safe function to update order status
export async function updateClientOrderStatus(
  orderId: string,
  status: "pending" | "in-progress" | "completed"
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/staff/orders/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        status
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update order status');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
}
