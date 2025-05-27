"use client"

import { supabase } from './supabase-client'

// Credit system types
export type UserCredits = {
  id: string
  user_id: string
  balance: number
  updated_at: string
}

export type CreditTransaction = {
  id: string
  user_id: string
  amount: number
  transaction_type: 'purchase' | 'redemption' | 'refund' | 'bonus'
  description?: string
  kit_id?: string
  created_at: string
}

// Credit system functions
export async function getUserCredits(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      // If no record exists, create one with zero balance
      if (error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('user_credits')
          .insert([{ user_id: userId, balance: 0 }])
          .select()
          .single()
        
        if (insertError) throw insertError
        return newData?.balance || 0
      }
      throw error
    }
    
    return data?.balance || 0
  } catch (error) {
    console.error("Error getting user credits:", error)
    return 0
  }
}

export async function addCredits(
  userId: string, 
  amount: number, 
  transactionType: 'purchase' | 'bonus' | 'refund' = 'purchase',
  description: string = ''
): Promise<{ success: boolean; newBalance: number; error: string | null }> {
  try {
    if (amount <= 0) {
      return { 
        success: false, 
        newBalance: 0, 
        error: 'Amount must be positive' 
      }
    }
    
    // Start a transaction
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single()
    
    // If no record exists, create one
    let currentBalance = 0
    if (creditsError) {
      if (creditsError.code === 'PGRST116') {
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert([{ user_id: userId, balance: amount }])
          .select()
          .single()
        
        if (insertError) throw insertError
        currentBalance = newCredits?.balance || amount
      } else {
        throw creditsError
      }
    } else {
      currentBalance = credits?.balance || 0
      
      // Update the user's credit balance
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ balance: currentBalance + amount, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      
      if (updateError) throw updateError
      currentBalance += amount
    }
    
    // Log the transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert([{
        user_id: userId,
        amount: amount,
        transaction_type: transactionType,
        description: description
      }])
    
    if (transactionError) throw transactionError
    
    return {
      success: true,
      newBalance: currentBalance,
      error: null
    }
  } catch (error) {
    console.error("Error adding credits:", error)
    return {
      success: false,
      newBalance: 0,
      error: 'Failed to add credits'
    }
  }
}

export async function useCredits(
  userId: string, 
  amount: number, 
  kitId: string,
  description: string = ''
): Promise<{ success: boolean; newBalance: number; error: string | null }> {
  try {
    if (amount <= 0) {
      return { 
        success: false, 
        newBalance: 0, 
        error: 'Amount must be positive' 
      }
    }
    
    // Get current balance
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single()
    
    if (creditsError) {
      if (creditsError.code === 'PGRST116') {
        return {
          success: false,
          newBalance: 0,
          error: 'No credits available'
        }
      }
      throw creditsError
    }
    
    const currentBalance = credits?.balance || 0
    
    // Check if user has enough credits
    if (currentBalance < amount) {
      return {
        success: false,
        newBalance: currentBalance,
        error: 'Insufficient credits'
      }
    }
    
    // Update the user's credit balance
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ balance: currentBalance - amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
    
    if (updateError) throw updateError
    
    // Log the transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert([{
        user_id: userId,
        amount: -amount, // Negative amount for usage
        transaction_type: 'redemption',
        description: description,
        kit_id: kitId
      }])
    
    if (transactionError) throw transactionError
    
    return {
      success: true,
      newBalance: currentBalance - amount,
      error: null
    }
  } catch (error) {
    console.error("Error using credits:", error)
    return {
      success: false,
      newBalance: 0,
      error: 'Failed to use credits'
    }
  }
}

export async function getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting credit transactions:", error)
    return []
  }
}
