"use client"

import { supabase } from './supabase-client'
import { User, HydrationEvent, DailyTarget, HydrationKit, Order } from './types/database.types'
import bcrypt from 'bcrypt'

// Authentication functions with secure bcrypt implementation
export async function registerUser(email: string, password: string, name: string, weight: number, bodyType: "muscular" | "average" | "stocky"): Promise<{ user: User | null; error: string | null }> {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      return { user: null, error: 'User already exists with this email' }
    }
    
    // Hash the password with bcrypt (much more secure)
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    
    // Create a separate authentication record
    const { data: authData, error: authError } = await supabase
      .from('user_auth')
      .insert([
        { 
          email, 
          password_hash: passwordHash,
          salt: '' // bcrypt stores the salt within the hash, so we don't need a separate salt field
        }
      ])
      .select()
    
    if (authError) throw authError
    
    // Create user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        { 
          email,
          name,
          weight,
          body_type: bodyType,
        }
      ])
      .select()
    
    if (userError) throw userError
    
    return { user: userData[0], error: null }
  } catch (error: any) {
    console.error('Error registering user:', error)
    return { user: null, error: error.message }
  }
}

export async function loginUser(email: string, password: string): Promise<{ user: User | null; isStaff: boolean; error: string | null }> {
  try {
    // Get the auth record for this email
    const { data: authData, error: authError } = await supabase
      .from('user_auth')
      .select('*')
      .eq('email', email)
      .single()
    
    if (authError || !authData) {
      return { user: null, isStaff: false, error: 'Invalid email or password' }
    }
    
    // Verify password using bcrypt
    const passwordMatches = await bcrypt.compare(password, authData.password_hash)
    if (!passwordMatches) {
      return { user: null, isStaff: false, error: 'Invalid email or password' }
    }
    
    // Check if user is staff (based on email pattern or domain)
    const isStaff = email.endsWith('@waterbar.admin.com') || 
                    ['admin@thewaterbar.ae', 'staff@thewaterbar.ae'].includes(email);
    
    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (userError) throw userError
    
    return { user: userData, isStaff, error: null }
  } catch (error: any) {
    console.error('Error logging in:', error)
    return { user: null, error: error.message }
  }
}

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

export async function getOrders(status?: 'pending' | 'in-progress' | 'completed'): Promise<Order[]> {
  try {
    let query = supabase.from('orders').select('*, users(name)')
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query.order('ordered_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

export async function updateOrderStatus(orderId: string, status: 'pending' | 'in-progress' | 'completed'): Promise<Order | null> {
  try {
    const updates: any = { status }
    
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating order status:", error)
    return null
  }
}
