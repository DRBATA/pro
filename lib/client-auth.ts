"use client"

import { supabase } from './supabase-client'
import { User } from './types/database.types'

// Client-safe registration function (no bcrypt)
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
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Call a server action or API endpoint to handle the secure parts
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
        nickname,
        weight,
        sex,
        bodyType,
        phoneNumber,
        contactPreference
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Registration failed');
    }
    
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('Error registering user:', error);
    return { user: null, error: error.message };
  }
}

// Client-safe login function (no bcrypt)
export async function loginUserClient(
  email: string,
  password: string
): Promise<{ user: User | null; isStaff: boolean; error: string | null }> {
  try {
    // Call a server action or API endpoint to handle the secure parts
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Login failed');
    }
    
    return { 
      user: result.user, 
      isStaff: result.isStaff || false, 
      error: null 
    };
  } catch (error: any) {
    console.error('Error logging in:', error);
    return { user: null, isStaff: false, error: error.message };
  }
}
