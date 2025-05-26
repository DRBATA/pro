"use client"

import { supabase } from './supabase-client'
import { User, HydrationEvent, DailyTarget, HydrationKit, Order } from './types/database.types'
import { calculateHydrationGap, ActivityIntensity, ActivityContext } from './hydration-engine'

// Client-safe database functions (no bcrypt or other Node.js native modules)

// User profile functions
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating user profile:", error)
    return null
  }
}

// Hydration event functions
export async function logHydrationEvent(event: Omit<HydrationEvent, 'id' | 'created_at'>): Promise<HydrationEvent | null> {
  try {
    const { data, error } = await supabase
      .from('hydration_events')
      .insert([event])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error logging hydration event:", error)
    return null
  }
}

export async function getTodayHydrationEvents(userId: string): Promise<HydrationEvent[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('hydration_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_date', today)
      .order('event_time', { ascending: true })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching today's hydration events:", error)
    return []
  }
}

// Daily target functions
export async function getDailyTarget(userId: string): Promise<DailyTarget | null> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('daily_targets')
      .select('*')
      .eq('user_id', userId)
      .eq('target_date', today)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching daily target:", error)
    return null
  }
}

// Hydration kit functions
export async function getHydrationKits(): Promise<HydrationKit[]> {
  try {
    const { data, error } = await supabase
      .from('hydration_kits')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching hydration kits:", error)
    return []
  }
}

// Order functions
export async function createOrder(order: Omit<Order, 'id' | 'ordered_at' | 'completed_at'>): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating order:", error)
    return null
  }
}

// Hydration gap calculation function
export async function getUserHydrationGap(userId: string): Promise<{
  hydrationGap: number,
  context: ActivityContext,
  leanBodyMass: number,
  waterLoss: number,
  waterFromFood: number,
  totalWaterInput: number,
  recommendedIntake: number,
  user: User | null,
  events: HydrationEvent[]
} | null> {
  try {
    // 1. Get user profile for weight, sex, and body type
    const user = await getUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 2. Get today's hydration events
    const events = await getTodayHydrationEvents(userId);
    
    // 3. Calculate totals from events
    let totalWaterIntake = 0;
    let totalFoodIntake: Array<{food: string, amount: number}> = [];
    let latestActivity = '';
    let activityDuration = 0;
    let activityIntensity: ActivityIntensity = 'moderate';
    
    // Process events to calculate totals
    events.forEach(event => {
      if (event.event_type === 'water' || event.event_type === 'electrolyte') {
        totalWaterIntake += event.amount || 0;
      } 
      else if (event.event_type === 'food') {
        // Add food water content
        if (event.food_type && event.amount) {
          totalFoodIntake.push({
            food: event.food_type,
            amount: event.amount
          });
        }
      }
      else if (event.event_type === 'workout') {
        // Track the latest activity
        latestActivity = event.activity_type || 'desk';
        activityDuration = event.duration || 30; // Default to 30 minutes
        
        // If intensity is specified in the event
        if (event.intensity) {
          activityIntensity = event.intensity as ActivityIntensity;
        } else {
          // Infer intensity from workout details if available
          if (event.pre_weight && event.post_weight) {
            const sweatLoss = (event.pre_weight - event.post_weight) * 1000;
            // If significant sweat loss, consider it intense
            activityIntensity = sweatLoss > 800 ? 'intense' : 
                               sweatLoss > 400 ? 'moderate' : 'light';
          }
        }
      }
    });
    
    // If no activity recorded today, default to desk work
    if (!latestActivity) {
      latestActivity = 'desk';
      activityDuration = 240; // Default to 4 hours of desk work
    }
    
    // 4. Calculate hydration gap
    const result = calculateHydrationGap(
      user.weight,
      user.sex as 'male' | 'female',
      user.body_type,
      latestActivity,
      activityDuration,
      activityIntensity,
      totalWaterIntake,
      totalFoodIntake
    );
    
    return {
      ...result,
      user,
      events
    };
    
  } catch (error) {
    console.error('Error calculating hydration gap:', error);
    return null;
  }
}
