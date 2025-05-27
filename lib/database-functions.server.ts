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

    // Hash the password with bcrypt (salt is automatically embedded in the hash)
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    // Store credentials in user_auth table
    const { error: authError } = await supabase
      .from('user_auth')
      .insert([{
        email,
        password_hash: hashedPassword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        failed_attempts: 0
      }])

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`)
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

    // Get auth credentials from user_auth table without using .single()
    const { data: authDataArray, error: authError } = await supabase
      .from('user_auth')
      .select('*')
      .eq('email', email)

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`)
    }

    // Check if we found any auth records
    if (!authDataArray || authDataArray.length === 0) {
      return { user: null, isStaff: false, error: 'Invalid credentials' }
    }
    
    // Use the first auth record found
    const authData = authDataArray[0]

    // Verify password using bcrypt
    const passwordValid = await bcrypt.compare(password, authData.password_hash)
    
    if (!passwordValid) {
      // Update failed attempts
      await supabase
        .from('user_auth')
        .update({ 
          failed_attempts: authData.failed_attempts + 1,
          updated_at: new Date().toISOString(),
          // Optionally lock account after X failed attempts
          ...(authData.failed_attempts + 1 >= 5 ? { 
            locked_until: new Date(Date.now() + 30 * 60000).toISOString() // Lock for 30 minutes
          } : {})
        })
        .eq('email', email)
      
      return { user: null, isStaff: false, error: 'Invalid credentials' }
    }
    
    // Reset failed attempts on successful login
    await supabase
      .from('user_auth')
      .update({ 
        failed_attempts: 0,
        updated_at: new Date().toISOString(),
        locked_until: null
      })
      .eq('email', email)
    
    // Check if account is locked
    if (authData.locked_until && new Date(authData.locked_until) > new Date()) {
      return { user: null, isStaff: false, error: 'Account is locked. Try again later.' }
    }
      
    const isStaff = users[0].is_staff || false

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
