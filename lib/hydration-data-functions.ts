"use client"

import { supabase } from './supabase-client'
import { Database } from './types/database.types'

// Type definitions for our current database structure
export type InputLibraryItem = Database['public']['Tables']['input_library']['Row']
export type TimelineEvent = Database['public']['Tables']['timeline_events']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type DailyTarget = Database['public']['Tables']['daily_targets']['Row']

// Totals type used for calculations
export type InputLibraryTotals = {
  id: string
  name: string
  category: string
  duration_min: number | null
  water_volume_ml: number
  protein_g: number
  sodium_mg: number
  potassium_mg: number
  description: string | null
}

// Summary type for hydration data
export type DailyHydrationSummary = {
  user_id: string
  day: string
  total_water_ml: number
  total_sodium_mg: number
  total_potassium_mg: number
  total_protein_g: number
  activities: string
  total_activity_minutes: number
  had_outdoor_activity: boolean
  max_temperature: number | null
}

// Input Library Functions
export async function getInputLibraryItems(category?: string): Promise<InputLibraryItem[]> {
  try {
    let query = supabase
      .from('input_library')
      .select('*')
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching input library items:", error)
    return []
  }
}

export async function getInputLibraryItem(id: string): Promise<InputLibraryItem | null> {
  try {
    const { data, error } = await supabase
      .from('input_library')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error fetching input library item ${id}:`, error)
    return null
  }
}

// Timeline Events Functions
export async function getUserTimelineEvents(
  userId: string,
  date?: Date
): Promise<TimelineEvent[]> {
  try {
    let query = supabase
      .from('timeline_events')
      .select('*')
      .eq('user_id', userId)
    
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      query = query
        .gte('event_time', startOfDay.toISOString())
        .lte('event_time', endOfDay.toISOString())
    }
    
    const { data, error } = await query.order('event_time')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching user timeline events:", error)
    return []
  }
}

/**
 * Add a new event to the user's hydration timeline
 * @param userId - The ID of the user
 * @param sessionId - The ID of the active hydration session
 * @param eventType - The type of event ('food', 'drink', 'activity')
 * @param inputItemId - The ID of the input library item (optional for activities)
 * @param quantity - The quantity of the item
 * @param durationMinutes - For activities, the duration in minutes
 * @param eventTime - The time of the event (defaults to now)
 * @param environmentalTemp - For outdoor activities, the temperature in Celsius
 * @param environmentalHumidity - For outdoor activities, the humidity percentage
 * @param notes - Optional notes about the event
 * @returns The newly created timeline event
 */
export async function addTimelineEvent(
  userId: string,
  sessionId: string,
  eventType: 'food' | 'drink' | 'activity',
  inputItemId?: string,
  quantity: number = 1,
  durationMinutes?: number,
  eventTime?: Date,
  environmentalTemp?: number,
  environmentalHumidity?: number,
  notes?: string
): Promise<TimelineEvent | null> {
  try {
    const timestamp = eventTime || new Date()
    
    const { data, error } = await supabase
      .from('timeline_events')
      .insert([{
        user_id: userId,
        session_id: sessionId,
        event_time: timestamp.toISOString(),
        event_type: eventType,
        input_item_id: inputItemId,
        quantity: quantity,
        duration_minutes: durationMinutes,
        is_completed: true,
        environmental_temp: environmentalTemp,
        environmental_humidity: environmentalHumidity,
        notes: notes
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error adding timeline event:", error)
    return null
  }
}

/**
 * Get the active hydration session for a user
 * @param userId - The ID of the user
 * @returns The active hydration session or null if none exists
 */
export async function getActiveHydrationSession(
  userId: string
): Promise<{ id: string, start_time: string } | null> {
  try {
    const { data, error } = await supabase
      .from('hydration_sessions')
      .select('id, start_time')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching active hydration session:", error)
    return null
  }
}

// Timeline Analysis Functions
export async function calculateUserHydrationNeeds(
  userId: string
): Promise<{
  water_ml: number,
  sodium_mg: number,
  potassium_mg: number,
  protein_g: number
}> {
  try {
    // Get the user's profile for body metrics
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('weight, sex, body_type')
      .eq('id', userId)
      .single()
    
    if (userError || !user) throw userError || new Error('User not found')
    
    // Calculate recommended intakes based on user profile
    const weight = user.weight || 70 // Default to 70kg if not set
    const sex = (user.sex as 'male' | 'female') || 'male'
    const bodyType = user.body_type || 'average'
    
    // Base hydration calculations
    const baseWaterPerKg = sex === 'male' ? 35 : 31
    const recommendedWater = weight * baseWaterPerKg
    
    // Base electrolyte and protein calculations
    const baseSodium = 1500 // mg per day
    const basePotassium = 2500 // mg per day
    const baseProtein = weight * 0.8 // 0.8g per kg
    
    return {
      water_ml: recommendedWater,
      sodium_mg: baseSodium,
      potassium_mg: basePotassium,
      protein_g: baseProtein
    }
  } catch (error) {
    console.error("Error calculating hydration needs:", error)
    return {
      water_ml: 2500, // Default values if calculation fails
      sodium_mg: 1500,
      potassium_mg: 2500,
      protein_g: 50
    }
  }
}

// Function to get products based on user profile
export async function getRecommendedProducts(
  userId: string
): Promise<Product[]> {
  try {
    // Get all products
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
    
    if (error) throw error
    return products || []
  } catch (error) {
    console.error("Error fetching recommended products:", error)
    return []
  }
}
