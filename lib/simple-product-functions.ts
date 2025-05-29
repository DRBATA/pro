import { supabase } from "@/lib/supabase-client"

// Simple type definitions
export type Product = {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  category: string
  water_ml?: number
  sodium_mg?: number
  potassium_mg?: number
}

export type ProductRecommendation = {
  productId: string
  priority: number
  quantity: number
}

// Get available products
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching products:', error);
    return [];
  }
}

// Simple function to get a single water product
export async function getWaterProduct(): Promise<Product | null> {
  try {
    // Get a single water product from the database
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'water')
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching water product:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error fetching water product:', error);
    return null;
  }
}

// Create a simple recommendation
export function createSimpleRecommendation(productId: string): ProductRecommendation[] {
  return [
    {
      productId,
      priority: 1,
      quantity: 1
    }
  ];
}

// Submit an order
export async function createOrder(userId: string, items: {
  product_id: string;
  quantity: number;
  price: number;
}[]): Promise<boolean> {
  try {
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const { error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        status: 'pending',
        items: items
      });
    
    if (error) {
      console.error('Error creating order:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error creating order:', error);
    return false;
  }
}
