"use client"

import { useState, useEffect, useCallback } from "react"
import { getUserCredits, addCredits, useCredits as spendCredits, getCreditTransactions } from "@/lib/credit-functions"
import { CreditTransaction } from "@/lib/types/database.types"

export function useCredits(userId: string) {
  const [credits, setCredits] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [isTransactionsLoading, setIsTransactionsLoading] = useState<boolean>(true)

  // Fetch user's credit balance
  const fetchCredits = useCallback(async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      const balance = await getUserCredits(userId)
      setCredits(balance)
    } catch (error) {
      console.error("Error fetching credits:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Fetch user's transaction history
  const fetchTransactions = useCallback(async () => {
    if (!userId) return
    
    setIsTransactionsLoading(true)
    try {
      const txns = await getCreditTransactions(userId)
      setTransactions(txns)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsTransactionsLoading(false)
    }
  }, [userId])

  // Add credits to the user's account
  const addUserCredits = useCallback(async (
    amount: number, 
    transactionType: 'purchase' | 'bonus' | 'refund' = 'purchase',
    description: string = ''
  ) => {
    if (!userId) {
      return { success: false, newBalance: 0, error: 'User ID is required' }
    }
    
    try {
      const result = await addCredits(userId, amount, transactionType, description)
      
      if (result.success) {
        setCredits(result.newBalance)
        fetchTransactions() // Refresh transactions after successful addition
      }
      
      return result
    } catch (error) {
      console.error("Error adding credits:", error)
      return { success: false, newBalance: credits, error: 'Failed to add credits' }
    }
  }, [userId, credits, fetchTransactions])

  // Use credits to purchase a hydration kit
  const useUserCredits = useCallback(async (
    amount: number,
    kitId: string,
    description: string = ''
  ) => {
    if (!userId) {
      return { success: false, newBalance: 0, error: 'User ID is required' }
    }
    
    try {
      const result = await spendCredits(userId, amount, kitId, description)
      
      if (result.success) {
        setCredits(result.newBalance)
        fetchTransactions() // Refresh transactions after successful usage
      }
      
      return result
    } catch (error) {
      console.error("Error using credits:", error)
      return { success: false, newBalance: credits, error: 'Failed to use credits' }
    }
  }, [userId, credits, fetchTransactions])

  // Load initial data
  useEffect(() => {
    if (userId) {
      fetchCredits()
      fetchTransactions()
    }
  }, [userId, fetchCredits, fetchTransactions])

  return {
    credits,
    isLoading,
    transactions,
    isTransactionsLoading,
    addCredits: addUserCredits,
    useCredits: useUserCredits,
    refreshCredits: fetchCredits,
    refreshTransactions: fetchTransactions
  }
}
