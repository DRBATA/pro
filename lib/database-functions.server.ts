"use server"

// This file contains server-only functions
import bcrypt from 'bcrypt'
import { supabase } from './supabase-client'
import { User } from './types/database.types'

// Register user - server-side only function
export async function registerUser(
  email: string, 
  password: string, 
  name: string, 
  nickname: string = "",
  weight: number, 
  sex: "male" | "female",
  bodyType: string,
  phoneNumber: string = "",
  contactPreference: "email" | "whatsapp" | "phone" | "text" = "email"
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Check if user already exists
    const { data: existingUsers, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)

    if (queryError) {
      throw new Error(queryError.message)
    }

    if (existingUsers && existingUsers.length > 0) {
      return { user: null, error: 'User with this email already exists' }
    }

    // Hash the password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: hashedPassword,
      options: {
        data: {
          name,
          is_staff: false
        }
      }
    })

    if (authError) {
      throw new Error(authError.message)
    }

    // Create user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        { 
          email,
          name,
          nickname,
          weight,
          sex,
          body_type: bodyType,
          phone_number: phoneNumber,
          contact_preference: contactPreference
        }
      ])
      .select()

    if (userError) {
      throw new Error(userError.message)
    }

    if (!userData || userData.length === 0) {
      throw new Error('Failed to create user profile')
    }

    return { user: userData[0], error: null }
  } catch (error: any) {
    console.error('Error registering user:', error)
    return { user: null, error: error.message }
  }
}

// Login user - server-side only function
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User | null; isStaff: boolean; error: string | null }> {
  try {
    // Get user from database
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)

    if (queryError) {
      throw new Error(queryError.message)
    }

    if (!users || users.length === 0) {
      return { user: null, isStaff: false, error: 'User not found' }
    }

    // Get auth user to verify password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      throw new Error(authError.message)
    }

    const isStaff = authData.user.user_metadata.is_staff || false

    return { user: users[0], isStaff, error: null }
  } catch (error: any) {
    console.error('Error logging in:', error)
    return { user: null, isStaff: false, error: error.message }
  }
}

// Update user profile - server-side only function
export async function updateProfile(
  userId: string,
  userData: Partial<User>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message }
  }
}
