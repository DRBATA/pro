"use client"

import { supabase } from './supabase-client'
import { Database } from './types/database.types'

// Type definitions for our new database structure
export type InputLibraryItem = Database['public']['Tables']['input_library']['Row']
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
export type HydrationPlan = Database['public']['Tables']['hydration_plans']['Row']
export type HydrationLog = Database['public']['Tables']['hydration_logs']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type DailyTimelineItem = {
  type: 'plan' | 'log' | 'activity'
  id: string
  user_id: string
  timestamp: string
  item_name: string
  item_category: string
  quantity: number
  fulfilled: boolean
  fulfilled_at: string | null
}
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
export async function getInputLibraryItems(category?: string): Promise<InputLibraryTotals[]> {
  try {
    let query = supabase
      .from('input_library_totals')
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

export async function getInputLibraryItem(id: string): Promise<InputLibraryTotals | null> {
  try {
    const { data, error } = await supabase
      .from('input_library_totals')
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

// Hydration Plans Functions
export async function addHydrationPlan(
  userId: string,
  scheduledAt: Date,
  inputItemId: string,
  quantity: number = 1
): Promise<HydrationPlan | null> {
  try {
    const { data, error } = await supabase
      .from('hydration_plans')
      .insert([{
        user_id: userId,
        scheduled_at: scheduledAt.toISOString(),
        input_item_id: inputItemId,
        quantity
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error adding hydration plan:", error)
    return null
  }
}

export async function getUserHydrationPlans(
  userId: string,
  date?: Date
): Promise<HydrationPlan[]> {
  try {
    let query = supabase
      .from('hydration_plans')
      .select('*')
      .eq('user_id', userId)
    
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      query = query
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
    }
    
    const { data, error } = await query.order('scheduled_at')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching user hydration plans:", error)
    return []
  }
}

export async function fulfillHydrationPlan(
  planId: string
): Promise<HydrationPlan | null> {
  try {
    const now = new Date()
    
    // First, get the plan to create the log
    const { data: plan, error: planError } = await supabase
      .from('hydration_plans')
      .select('*')
      .eq('id', planId)
      .single()
    
    if (planError || !plan) throw planError || new Error('Plan not found')
    
    // Create a log entry
    const { error: logError } = await supabase
      .from('hydration_logs')
      .insert([{
        user_id: plan.user_id,
        logged_at: now.toISOString(),
        input_item_id: plan.input_item_id,
        quantity: plan.quantity,
        plan_id: planId
      }])
    
    if (logError) throw logError
    
    // Mark the plan as fulfilled
    const { data: updatedPlan, error: updateError } = await supabase
      .from('hydration_plans')
      .update({
        fulfilled: true,
        fulfilled_at: now.toISOString()
      })
      .eq('id', planId)
      .select()
      .single()
    
    if (updateError) throw updateError
    return updatedPlan
  } catch (error) {
    console.error(`Error fulfilling hydration plan ${planId}:`, error)
    return null
  }
}

// Hydration Logs Functions
export async function addHydrationLog(
  userId: string,
  inputItemId: string,
  quantity: number = 1,
  loggedAt?: Date
): Promise<HydrationLog | null> {
  try {
    const timestamp = loggedAt || new Date()
    
    const { data, error } = await supabase
      .from('hydration_logs')
      .insert([{
        user_id: userId,
        logged_at: timestamp.toISOString(),
        input_item_id: inputItemId,
        quantity
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error adding hydration log:", error)
    return null
  }
}

export async function getUserHydrationLogs(
  userId: string,
  date?: Date
): Promise<HydrationLog[]> {
  try {
    let query = supabase
      .from('hydration_logs')
      .select('*')
      .eq('user_id', userId)
    
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      query = query
        .gte('logged_at', startOfDay.toISOString())
        .lte('logged_at', endOfDay.toISOString())
    }
    
    const { data, error } = await query.order('logged_at')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching user hydration logs:", error)
    return []
  }
}

// Activity Logs Functions
export async function addActivityLog(
  userId: string,
  activityType: string,
  intensity: string = 'moderate',
  durationMinutes: number = 30,
  startedAt?: Date,
  outdoor: boolean = false,
  temperatureCelsius?: number,
  humidityPercent?: number
): Promise<ActivityLog | null> {
  try {
    const timestamp = startedAt || new Date()
    
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([{
        user_id: userId,
        activity_type: activityType,
        intensity,
        duration_minutes: durationMinutes,
        started_at: timestamp.toISOString(),
        outdoor,
        temperature_celsius: temperatureCelsius,
        humidity_percent: humidityPercent
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error adding activity log:", error)
    return null
  }
}

export async function getUserActivityLogs(
  userId: string,
  date?: Date
): Promise<ActivityLog[]> {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
    
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      query = query
        .gte('started_at', startOfDay.toISOString())
        .lte('started_at', endOfDay.toISOString())
    }
    
    const { data, error } = await query.order('started_at')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching user activity logs:", error)
    return []
  }
}

// Timeline and Summary Functions
export async function getUserDailyTimeline(
  userId: string,
  date?: Date
): Promise<DailyTimelineItem[]> {
  try {
    const queryDate = date || new Date()
    const startOfDay = new Date(queryDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(queryDate)
    endOfDay.setHours(23, 59, 59, 999)
    
    // Since we might not have the view function available yet, let's query each table separately
    // and combine the results
    
    // Get hydration plans
    const { data: plans, error: plansError } = await supabase
      .from('hydration_plans')
      .select('*, input_library!inner(*)')
      .eq('user_id', userId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
    
    if (plansError) throw plansError
    
    // Get hydration logs
    const { data: logs, error: logsError } = await supabase
      .from('hydration_logs')
      .select('*, input_library!inner(*)')
      .eq('user_id', userId)
      .gte('logged_at', startOfDay.toISOString())
      .lte('logged_at', endOfDay.toISOString())
    
    if (logsError) throw logsError
    
    // Get activity logs
    const { data: activities, error: activitiesError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', startOfDay.toISOString())
      .lte('started_at', endOfDay.toISOString())
    
    if (activitiesError) throw activitiesError
    
    // Transform plans to timeline items
    const planItems: DailyTimelineItem[] = (plans || []).map(plan => ({
      type: 'plan',
      id: plan.id,
      user_id: plan.user_id,
      timestamp: plan.scheduled_at,
      item_name: plan.input_library.name,
      item_category: plan.input_library.category,
      quantity: plan.quantity,
      fulfilled: plan.fulfilled,
      fulfilled_at: plan.fulfilled_at
    }))
    
    // Transform logs to timeline items
    const logItems: DailyTimelineItem[] = (logs || []).map(log => ({
      type: 'log',
      id: log.id,
      user_id: log.user_id,
      timestamp: log.logged_at,
      item_name: log.input_library.name,
      item_category: log.input_library.category,
      quantity: log.quantity,
      fulfilled: true,
      fulfilled_at: log.logged_at
    }))
    
    // Transform activities to timeline items
    const activityItems: DailyTimelineItem[] = (activities || []).map(activity => ({
      type: 'activity',
      id: activity.id,
      user_id: activity.user_id,
      timestamp: activity.started_at,
      item_name: activity.activity_type,
      item_category: 'activity',
      quantity: activity.duration_minutes,
      fulfilled: true,
      fulfilled_at: activity.started_at
    }))
    
    // Combine and sort all items by timestamp
    const allItems = [...planItems, ...logItems, ...activityItems]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    
    return allItems
  } catch (error) {
    console.error("Error fetching user daily timeline:", error)
    return []
  }
}

export async function getUserDailyHydrationSummary(
  userId: string,
  date?: Date
): Promise<DailyHydrationSummary | null> {
  try {
    const queryDate = date || new Date()
    const startOfDay = new Date(queryDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(queryDate)
    endOfDay.setHours(23, 59, 59, 999)
    
    // Since we might not have the view available yet, let's calculate the summary manually
    
    // Get all logs for the day
    const { data: logs, error: logsError } = await supabase
      .from('hydration_logs')
      .select('*, input_library!inner(*)')
      .eq('user_id', userId)
      .gte('logged_at', startOfDay.toISOString())
      .lte('logged_at', endOfDay.toISOString())
    
    if (logsError) throw logsError
    
    // Get all activities for the day
    const { data: activities, error: activitiesError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', startOfDay.toISOString())
      .lte('started_at', endOfDay.toISOString())
    
    if (activitiesError) throw activitiesError
    
    // Calculate water, sodium, potassium, and protein totals
    let totalWaterMl = 0
    let totalSodiumMg = 0
    let totalPotassiumMg = 0
    let totalProteinG = 0
    
    for (const log of logs || []) {
      // Calculate totals based on input_library data using proper conversion factors
      // Water: values are in mL directly
      // Sodium (Na): values in mmol, convert to mg by multiplying by 23
      // Potassium (K): values in mmol, convert to mg by multiplying by 39.1
      // Chloride (Cl): values in mmol, convert to mg by multiplying by 35.5
      
      // Calculate total water volume from all compartments
      const waterVolumeMl = (
        Number(log.input_library.ivf?.H2O || 0) +
        Number(log.input_library.isf?.H2O || 0) +
        Number(log.input_library.icf?.H2O || 0)
      ) * log.quantity
      
      // Calculate total sodium (Na) in mg from all compartments
      const sodiumMg = (
        (Number(log.input_library.ivf?.Na || 0) + 
         Number(log.input_library.isf?.Na || 0)) * 23 // Convert mmol to mg
      ) * log.quantity
      
      // Calculate total potassium (K) in mg from all compartments
      const potassiumMg = (
        (Number(log.input_library.icf?.K || 0) + 
         Number(log.input_library.ivf?.K || 0)) * 39.1 // Convert mmol to mg
      ) * log.quantity
      
      const proteinG = Number(log.input_library.protein_g || 0) * log.quantity
      
      totalWaterMl += waterVolumeMl
      totalSodiumMg += sodiumMg
      totalPotassiumMg += potassiumMg
      totalProteinG += proteinG
    }
    
    // Calculate activity totals
    let totalActivityMinutes = 0
    let hadOutdoorActivity = false
    let maxTemperature: number | null = null
    let activityTypes: string[] = []
    
    for (const activity of activities || []) {
      totalActivityMinutes += activity.duration_minutes
      
      if (activity.outdoor) {
        hadOutdoorActivity = true
        
        if (activity.temperature_celsius !== null) {
          maxTemperature = Math.max(
            maxTemperature || 0,
            activity.temperature_celsius
          )
        }
      }
      
      if (!activityTypes.includes(activity.activity_type)) {
        activityTypes.push(activity.activity_type)
      }
    }
    
    return {
      user_id: userId,
      day: startOfDay.toISOString().split('T')[0],
      total_water_ml: totalWaterMl,
      total_sodium_mg: totalSodiumMg,
      total_potassium_mg: totalPotassiumMg,
      total_protein_g: totalProteinG,
      activities: activityTypes.join(', '),
      total_activity_minutes: totalActivityMinutes,
      had_outdoor_activity: hadOutdoorActivity,
      max_temperature: maxTemperature
    }
  } catch (error) {
    console.error("Error calculating user daily hydration summary:", error)
    return null
  }
}

// Calculating hydration gaps using our new structure
export async function calculateUserHydrationGaps(
  userId: string,
  date?: Date
): Promise<{
  water_gap_ml: number,
  sodium_gap_mg: number,
  potassium_gap_mg: number,
  protein_gap_g: number,
  summary: DailyHydrationSummary | null
}> {
  try {
    // Get the user's profile for body metrics
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('weight, sex, body_type')
      .eq('id', userId)
      .single()
    
    if (userError || !user) throw userError || new Error('User not found')
    
    // Get the daily summary
    const summary = await getUserDailyHydrationSummary(userId, date)
    
    if (!summary) {
      // Return default gaps if no summary found
      return {
        water_gap_ml: 0,
        sodium_gap_mg: 0,
        potassium_gap_mg: 0,
        protein_gap_g: 0,
        summary: null
      }
    }
    
    // Calculate recommended intakes based on user profile and activity
    // This is a simplified version - would need to be expanded with actual formulas
    const weight = user.weight || 70 // Default to 70kg if not set
    const sex = (user.sex as 'male' | 'female') || 'male'
    const bodyType = user.body_type || 'average'
    
    // Base calculations (would be replaced with more sophisticated formulas)
    const baseWaterPerKg = sex === 'male' ? 35 : 31
    const recommendedWater = weight * baseWaterPerKg
    
    const activityMultiplier = 1 + (summary.total_activity_minutes / 60) * 0.1
    const adjustedWater = recommendedWater * activityMultiplier
    
    // Electrolyte calculations (simplified)
    const baseSodium = 1500 // mg per day
    const basePotassium = 2500 // mg per day
    const baseProtein = weight * 0.8 // 0.8g per kg
    
    // Calculate gaps
    const waterGap = adjustedWater - summary.total_water_ml
    const sodiumGap = baseSodium - summary.total_sodium_mg
    const potassiumGap = basePotassium - summary.total_potassium_mg
    const proteinGap = baseProtein - summary.total_protein_g
    
    return {
      water_gap_ml: Math.max(0, waterGap),
      sodium_gap_mg: Math.max(0, sodiumGap),
      potassium_gap_mg: Math.max(0, potassiumGap),
      protein_gap_g: Math.max(0, proteinGap),
      summary
    }
  } catch (error) {
    console.error("Error calculating hydration gaps:", error)
    return {
      water_gap_ml: 0,
      sodium_gap_mg: 0,
      potassium_gap_mg: 0,
      protein_gap_g: 0,
      summary: null
    }
  }
}

// Function to generate recommendations based on gaps
export async function generateHydrationRecommendations(
  userId: string,
  date?: Date
): Promise<{
  recommendations: Array<{
    input_item_id: string,
    name: string,
    quantity: number,
    water_contribution_ml: number,
    sodium_contribution_mg: number,
    potassium_contribution_mg: number,
    protein_contribution_g: number,
    description: string | null
  }>,
  gaps: {
    water_gap_ml: number,
    sodium_gap_mg: number,
    potassium_gap_mg: number,
    protein_gap_g: number
  }
}> {
  try {
    // Calculate the current gaps
    const { water_gap_ml, sodium_gap_mg, potassium_gap_mg, protein_gap_g } = 
      await calculateUserHydrationGaps(userId, date)
    
    // Fetch items from input library that could fill these gaps
    // This is a simple implementation - a more sophisticated algorithm would
    // try to find optimal combinations of items
    const items = await getInputLibraryItems()
    
    // Filter to drinks and foods that could help
    const relevantItems = items.filter(item => 
      (item.category === 'drink' || item.category === 'food') &&
      (item.water_volume_ml > 0 || item.sodium_mg > 0 || 
       item.potassium_mg > 0 || item.protein_g > 0)
    )
    
    // Simple greedy algorithm to fill gaps
    // A real implementation would use optimization to find best combinations
    const recommendations: Array<{
      input_item_id: string | number,
      name: string,
      quantity: number,
      water_contribution_ml: number,
      sodium_contribution_mg: number,
      potassium_contribution_mg: number,
      protein_contribution_g: number,
      description: string | null
    }> = []
    
    let remainingWaterGap = water_gap_ml
    let remainingSodiumGap = sodium_gap_mg
    let remainingPotassiumGap = potassium_gap_mg
    let remainingProteinGap = protein_gap_g
    
    // First, try to find drinks that contain electrolytes to address sodium and potassium gaps
    if (remainingSodiumGap > 0 || remainingPotassiumGap > 0) {
      const electrolyteItems = relevantItems.filter(item => 
        item.category === 'drink' && (item.sodium_mg > 0 || item.potassium_mg > 0)
      )
      
      if (electrolyteItems.length > 0) {
        // Sort by sodium content (could be improved to consider both Na and K)
        electrolyteItems.sort((a, b) => b.sodium_mg - a.sodium_mg)
        
        const bestItem = electrolyteItems[0]
        const quantity = Math.ceil(remainingSodiumGap / bestItem.sodium_mg)
        
        recommendations.push({
          input_item_id: bestItem.id,
          name: bestItem.name,
          quantity,
          water_contribution_ml: bestItem.water_volume_ml * quantity,
          sodium_contribution_mg: bestItem.sodium_mg * quantity,
          potassium_contribution_mg: bestItem.potassium_mg * quantity,
          protein_contribution_g: bestItem.protein_g * quantity,
          description: bestItem.description
        })
        
        // Update remaining gaps
        remainingWaterGap -= bestItem.water_volume_ml * quantity
        remainingSodiumGap -= bestItem.sodium_mg * quantity
        remainingPotassiumGap -= bestItem.potassium_mg * quantity
        remainingProteinGap -= bestItem.protein_g * quantity
      }
    }
    
    // Then, add water to address remaining water gap
    if (remainingWaterGap > 0) {
      const waterItems = relevantItems.filter(item => 
        item.category === 'drink' && item.water_volume_ml > 0 && 
        item.sodium_mg === 0 && item.potassium_mg === 0 // Plain water
      )
      
      if (waterItems.length > 0) {
        const bestItem = waterItems[0]
        const quantity = Math.ceil(remainingWaterGap / bestItem.water_volume_ml)
        
        recommendations.push({
          input_item_id: bestItem.id,
          name: bestItem.name,
          quantity,
          water_contribution_ml: bestItem.water_volume_ml * quantity,
          sodium_contribution_mg: 0,
          potassium_contribution_mg: 0,
          protein_contribution_g: 0,
          description: bestItem.description
        })
        
        remainingWaterGap -= bestItem.water_volume_ml * quantity
      }
    }
    
    // Add protein-rich items if needed
    if (remainingProteinGap > 0) {
      const proteinItems = relevantItems.filter(item => item.protein_g > 0)
      
      if (proteinItems.length > 0) {
        proteinItems.sort((a, b) => b.protein_g - a.protein_g)
        
        const bestItem = proteinItems[0]
        const quantity = Math.ceil(remainingProteinGap / bestItem.protein_g)
        
        recommendations.push({
          input_item_id: bestItem.id,
          name: bestItem.name,
          quantity,
          water_contribution_ml: bestItem.water_volume_ml * quantity,
          sodium_contribution_mg: bestItem.sodium_mg * quantity,
          potassium_contribution_mg: bestItem.potassium_mg * quantity,
          protein_contribution_g: bestItem.protein_g * quantity,
          description: bestItem.description
        })
        
        remainingProteinGap -= bestItem.protein_g * quantity
      }
    }
    
    // Add potassium-rich foods if there's still a potassium gap
    if (remainingPotassiumGap > 0) {
      const potassiumItems = relevantItems.filter(item => 
        item.category === 'food' && item.potassium_mg > 0
      )
      
      if (potassiumItems.length > 0) {
        potassiumItems.sort((a, b) => b.potassium_mg - a.potassium_mg)
        
        const bestItem = potassiumItems[0]
        const quantity = Math.ceil(remainingPotassiumGap / bestItem.potassium_mg)
        
        recommendations.push({
          input_item_id: bestItem.id,
          name: bestItem.name,
          quantity,
          water_contribution_ml: bestItem.water_volume_ml * quantity,
          sodium_contribution_mg: bestItem.sodium_mg * quantity,
          potassium_contribution_mg: bestItem.potassium_mg * quantity,
          protein_contribution_g: bestItem.protein_g * quantity,
          description: bestItem.description
        })
      }
    }
    
    return {
      recommendations,
      gaps: {
        water_gap_ml,
        sodium_gap_mg,
        potassium_gap_mg,
        protein_gap_g
      }
    }
  } catch (error) {
    console.error("Error generating hydration recommendations:", error)
    return {
      recommendations: [],
      gaps: {
        water_gap_ml: 0,
        sodium_gap_mg: 0,
        potassium_gap_mg: 0,
        protein_gap_g: 0
      }
    }
  }
}
