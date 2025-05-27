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
        setIsLoading(true);
        console.log('Starting user profile load');
        
        // First check Supabase auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw sessionError;
        }
        
        if (session?.user) {
          console.log('Found authenticated session for user ID:', session.user.id);
          
          // Try to get user by ID first (most reliable with our foreign key)
          let profileData;
          
          // Try to get user by ID
          const { data: profileById, error: profileByIdError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileById) {
            console.log('Found user profile by ID:', profileById);
            profileData = profileById;
          } else {
            console.log('Could not find profile by ID, trying email fallback');
            
            // Fallback to email if ID doesn't work
            if (session.user.email) {
              const { data: profileByEmail, error: profileByEmailError } = await supabase
                .from('users')
                .select('*')
                .eq('email', session.user.email)
                .single();
                
              if (profileByEmail) {
                console.log('Found user profile by email:', profileByEmail);
                profileData = profileByEmail;
              } else {
                console.log('No profile found by email either');
              }
            }
          }
          
          if (profileData) {
            console.log('Setting user profile to:', profileData);
            setUser(profileData);
            setIsStaff(profileData.is_staff || false);
            
            // Update localStorage for persistence
            localStorage.setItem('waterbar_user', JSON.stringify(profileData));
            localStorage.setItem('waterbar_is_staff', (profileData.is_staff || false).toString());
          } else {
            // Create a minimal user object just to make the UI work
            const minimalUser = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
              weight: 70,
              sex: 'male',
              body_type: 'average'
            };
            console.log('No profile found, using minimal user:', minimalUser);
            setUser(minimalUser as User);
          }
        } else {
          console.log('No active session');
          
          // Fallback to localStorage if no active session
          const storedUser = localStorage.getItem('waterbar_user');
          const storedIsStaff = localStorage.getItem('waterbar_is_staff');
          
          if (storedUser) {
            console.log('Using stored user from localStorage');
            setUser(JSON.parse(storedUser));
            setIsStaff(storedIsStaff === 'true');
          } else {
            console.log('No stored user');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session?.user) {
        try {
          // Get user profile when auth state changes
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profile && !profileError) {
            console.log('Auth state change: found profile:', profile);
            setUser(profile);
            setIsStaff(profile.is_staff || false);
            localStorage.setItem('waterbar_user', JSON.stringify(profile));
            localStorage.setItem('waterbar_is_staff', (profile.is_staff || false).toString());
          } else if (session.user.email) {
            // Fallback to email
            const { data: profileByEmail, error: profileByEmailError } = await supabase
              .from('users')
              .select('*')
              .eq('email', session.user.email)
              .single();
              
            if (profileByEmail && !profileByEmailError) {
              console.log('Auth state change: found profile by email:', profileByEmail);
              setUser(profileByEmail);
              setIsStaff(profileByEmail.is_staff || false);
              localStorage.setItem('waterbar_user', JSON.stringify(profileByEmail));
              localStorage.setItem('waterbar_is_staff', (profileByEmail.is_staff || false).toString());
            } else {
              // Create a minimal user object
              const minimalUser = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
                weight: 70,
                sex: 'male',
                body_type: 'average'
              };
              console.log('Auth state change: using minimal user:', minimalUser);
              setUser(minimalUser as User);
            }
          }
        } catch (err) {
          console.error('Error in auth state change handler:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear user data on sign out
        console.log('Auth state change: signed out, clearing user');
        setUser(null);
        setIsStaff(false);
        localStorage.removeItem('waterbar_user');
        localStorage.removeItem('waterbar_is_staff');
      }
    });
    
    // Clean up the listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
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
