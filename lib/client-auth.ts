"use client"

import { supabase } from './supabase-client'
import { User } from './types/database.types'

// Types for auth responses
type AuthResponse = {
  user: User | null;
  error: string | null;
  isStaff?: boolean;
  isVerified?: boolean;
}

// Client-safe function to check email verification status
export async function checkEmailVerification(): Promise<AuthResponse> {
  try {
    // Get the current session
    const { data, error } = await supabase.auth.getSession()
    
    if (error) throw error
    
    // If no session or no user, they're not logged in
    if (!data?.session?.user) {
      return { user: null, error: null, isVerified: false }
    }
    
    // Check if the email has been verified
    const isVerified = data.session.user.email_confirmed_at !== null
    
    // If verified, get the user profile
    if (isVerified) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.session.user.email)
        .single()
        
      if (userError && userError.code !== 'PGRST116') {
        throw userError
      }
      
      return { 
        user: userData || null, 
        isStaff: userData?.is_staff || false,
        error: null,
        isVerified
      }
    }
    
    return { user: null, error: null, isVerified }
  } catch (error: any) {
    console.error('Error checking verification:', error)
    return { user: null, error: error.message, isVerified: false }
  }
}

// Client-safe registration function (using Supabase Auth)
export async function registerUserClient(
  email: string, 
  password: string,
  name: string, 
  nickname: string = "",
  weight: number, 
  sex: "male" | "female",
  bodyType: string,
  phoneNumber: string = "",
  contactPreference: "email" | "whatsapp" | "phone" | "text" = "email"
): Promise<AuthResponse> {
  try {
    // Step 1: Create the auth user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { // Store user metadata
          name,
          nickname,
          weight,
          sex,
          body_type: bodyType,
          phone_number: phoneNumber,
          contact_preference: contactPreference
        }
      }
    });
    
    if (authError) throw authError;
    
    // Step 2: Create the user profile in the users table
    const { data: profileData, error: profileError } = await supabase
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
      .select();
      
    if (profileError) throw new Error(profileError.message);
    
    return {
      user: profileData?.[0] || null,
      error: null,
      isVerified: false // User needs to verify email
    };
  } catch (error: any) {
    console.error('Error registering user:', error);
    return { user: null, error: error.message };
  }
}

// Client-safe login function using password
export async function loginUserClient(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    // Use Supabase Auth to sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    // Check if email is verified
    const isVerified = data.user?.email_confirmed_at !== null
    
    // If not verified, return early
    if (!isVerified) {
      return {
        user: null,
        error: null,
        isVerified: false
      }
    }
    
    // Fetch user profile from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
      
    if (userError && userError.code !== 'PGRST116') { // Not found error
      throw userError
    }
    
    return { 
      user: userData || null, 
      isStaff: userData?.is_staff || false,
      error: null,
      isVerified: true
    }
  } catch (error: any) {
    console.error('Error logging in:', error)
    return { 
      user: null, 
      isStaff: false, 
      error: error.message || 'Login failed'
    }
  }
}
