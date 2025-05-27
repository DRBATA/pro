"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/lib/types/database.types'
import { loginUserClient } from '@/lib/client-auth'
import { supabase } from '@/lib/supabase-client'

interface UserContextType {
  user: User | null
  isStaff: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const defaultContext: UserContextType = {
  user: null,
  isStaff: false,
  isLoading: true,
  error: null,
  login: async () => false,
  logout: () => {}
}

const UserContext = createContext<UserContextType>(defaultContext)

export const useUser = () => useContext(UserContext)

interface UserProviderProps {
  children: ReactNode
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isStaff, setIsStaff] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Load user from Supabase Auth session and localStorage on initial render
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // First check Supabase auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          throw sessionError
        }
        
        if (session?.user?.email) {
          console.log('Found authenticated session for', session.user.email)
          
          // Get user profile from the users table
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single()
            
          if (profileError) {
            console.error('Error getting user profile:', profileError)
            throw profileError
          }
          
          if (profile) {
            console.log('Found user profile:', profile)
            setUser(profile)
            setIsStaff(profile.is_staff || false)
            
            // Update localStorage for persistence
            localStorage.setItem('waterbar_user', JSON.stringify(profile))
            localStorage.setItem('waterbar_is_staff', (profile.is_staff || false).toString())
            return
          }
        }
        
        // Fallback to localStorage if no active session
        const storedUser = localStorage.getItem('waterbar_user')
        const storedIsStaff = localStorage.getItem('waterbar_is_staff')
        
        if (storedUser) {
          setUser(JSON.parse(storedUser))
          setIsStaff(storedIsStaff === 'true')
        }
      } catch (err) {
        console.error('Error loading user data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserData()
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      
      if (session?.user?.email) {
        // Get user profile when auth state changes
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single()
          
        if (profile && !profileError) {
          setUser(profile)
          setIsStaff(profile.is_staff || false)
          localStorage.setItem('waterbar_user', JSON.stringify(profile))
          localStorage.setItem('waterbar_is_staff', (profile.is_staff || false).toString())
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear user data on sign out
        setUser(null)
        setIsStaff(false)
        localStorage.removeItem('waterbar_user')
        localStorage.removeItem('waterbar_is_staff')
      }
    })
    
    // Clean up the listener on unmount
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { user: loggedInUser, isStaff: userIsStaff, error: loginError } = 
        await loginUserClient(email, password)
      
      if (loginError || !loggedInUser) {
        setError(loginError || 'Login failed')
        return false
      }
      
      // Store user in state
      setUser(loggedInUser)
      setIsStaff(userIsStaff)
      
      // Store in localStorage for persistence
      localStorage.setItem('waterbar_user', JSON.stringify(loggedInUser))
      localStorage.setItem('waterbar_is_staff', userIsStaff.toString())
      
      return true
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Clear user from state
    setUser(null)
    setIsStaff(false)
    
    // Clear from storage
    localStorage.removeItem('waterbar_user')
    localStorage.removeItem('waterbar_is_staff')
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isStaff,
        isLoading,
        error,
        login,
        logout
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
