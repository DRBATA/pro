"use server"

import { supabase } from './supabase-client'
import { User } from './types/database.types'
import { updateProfile } from './database-functions.server'

// Get user data by ID - server-side only function
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

// Get user hydration gap data - server-side only function
export async function getUserHydrationGap(userId: string) {
  try {
    // Get user data
    const user = await getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get hydration events for the user (last 24 hours)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data: hydrationEvents, error: eventsError } = await supabase
      .from('hydration_events')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', twentyFourHoursAgo.toISOString())
      .order('timestamp', { ascending: false })

    if (eventsError) {
      console.error('Error fetching hydration events:', eventsError)
      throw new Error('Failed to fetch hydration events')
    }

    // Calculate total water input from hydration events
    const totalWaterInput = hydrationEvents?.reduce((total, event) => {
      return total + (event.amount || 0)
    }, 0) || 0

    // Calculate the hydration gap
    const { weight, sex, body_type } = user
    
    // Calculate lean body mass (LBM)
    const bodyFatPercentage = sex === 'male' 
      ? (body_type === 'muscular' ? 10 : body_type === 'athletic' ? 15 : 20)
      : (body_type === 'toned' ? 18 : body_type === 'athletic_female' ? 22 : 26)
    
    const leanBodyMass = weight * (1 - (bodyFatPercentage / 100))
    
    // Calculate water loss (based on LBM)
    const waterLoss = leanBodyMass * 0.03 * 1000 // 3% of LBM in ml
    
    // Water from food (estimate)
    const waterFromFood = 500 // ml
    
    // Calculate recommended intake
    const recommendedIntake = waterLoss + waterFromFood
    
    // Calculate hydration gap
    const hydrationGap = recommendedIntake - totalWaterInput
    
    // Determine context for the gap
    let context = 'optimal'
    if (hydrationGap > 1000) {
      context = 'severe'
    } else if (hydrationGap > 500) {
      context = 'moderate'
    } else if (hydrationGap > 200) {
      context = 'mild'
    } else if (hydrationGap < -200) {
      context = 'excess'
    }

    return {
      hydrationGap,
      context,
      leanBodyMass,
      waterLoss,
      waterFromFood,
      totalWaterInput,
      recommendedIntake
    }
  } catch (error: any) {
    console.error('Error calculating hydration gap:', error)
    throw new Error(`Failed to calculate hydration gap: ${error.message}`)
  }
}

// Update user profile - server-side only function
export async function updateUserProfile(
  userId: string,
  userData: Partial<User>
): Promise<{ success: boolean; error: string | null }> {
  return updateProfile(userId, userData)
}
