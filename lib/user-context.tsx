"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/lib/types/database.types'
import { loginUserClient } from '@/lib/client-auth'

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

  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('waterbar_user')
        const storedIsStaff = localStorage.getItem('waterbar_is_staff')
        
        if (storedUser) {
          setUser(JSON.parse(storedUser))
          setIsStaff(storedIsStaff === 'true')
        }
      } catch (err) {
        console.error('Error loading user from storage:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserFromStorage()
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
