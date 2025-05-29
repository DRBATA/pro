"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { User, Droplets, Eye, EyeOff } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabase } from "@/lib/supabase-client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loginUserClient } from "@/lib/client-auth"

// Form validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRegistered = searchParams.get("registered") === "true"
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [userData, setUserData] = useState<{isStaff: boolean} | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Clear all browser data when the login form loads
  useEffect(() => {
    clearAllBrowserData();
    console.log('Login page loaded: cleared all browser data and tokens');
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Aggressive cache and storage clearing function
  const clearAllBrowserData = async () => {
    if (typeof window === 'undefined') return;
    
    console.log('Performing aggressive cache/storage clearing...');
    
    // Clear all localStorage
    localStorage.clear();
    
    // Clear all sessionStorage
    sessionStorage.clear();
    
    // Clear all cookies for this domain
    document.cookie.split(';').forEach(cookie => {
      document.cookie = cookie.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    
    // Clear IndexedDB databases if possible
    try {
      const databases = await window.indexedDB.databases();
      databases.forEach(db => {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      });
    } catch (e) {
      console.log('IndexedDB clearing not supported or failed:', e);
    }
    
    // Try to clear cache via Cache API if available
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }
    } catch (e) {
      console.log('Cache API clearing failed:', e);
    }
    
    console.log('All browser storage cleared');
  };
  
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Starting login process...')
      
      // Aggressively clear all browser data
      await clearAllBrowserData();
      
      // Additional specific Supabase clearing
      if (typeof window !== 'undefined') {
        // Double-check these are cleared (redundant but safe)
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('sb-access-token')
        localStorage.removeItem('sb-refresh-token')
        localStorage.removeItem('supabase.auth.magic_link')
        localStorage.removeItem('userLoggedIn')
        localStorage.removeItem('userIsStaff')
        
        console.log('Verified Supabase auth data is cleared')
      }
      
      // Direct login using Supabase client to bypass any middleware issues
      const { data: authData, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        }),
        // Add a timeout to prevent infinite waiting
        new Promise<{data: null, error: any}>((resolve) => 
          setTimeout(() => resolve({data: null, error: {message: 'Login timed out. Please try again.'}}), 15000)
        )
      ])

      if (error) {
        console.error('Login error:', error)
        setError(error.message)
        setIsLoading(false)
        return
      }

      console.log('Login successful:', authData)
      
      // Store authentication in localStorage immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem('userLoggedIn', 'true')
      }
      
      // Fetch user profile
      try {
        const { data: userData, error: userError } = await Promise.race([
          supabase
            .from('users')
            .select('*')
            .eq('email', data.email)
            .single(),
          // Add a timeout for profile fetch
          new Promise<{data: null, error: any}>((resolve) => 
            setTimeout(() => resolve({data: null, error: {message: 'Profile fetch timed out'}}), 10000)
          )
        ])
          
        if (userError && userError.code !== 'PGRST116') {
          console.error('User fetch error:', userError)
          // Don't block login if profile fetch fails
          console.warn('Continuing with login despite profile fetch error')
        }

        // Login successful
        setLoginSuccess(true)
        setUserData({ isStaff: false }) // Simplified - we don't need staff functionality
        
        // Store user data in local storage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('userIsStaff', 'false') // Default to regular user
        }
      } catch (profileError) {
        console.error('Profile fetch error:', profileError)
        // Continue with login even if profile fetch fails
      }
      
      console.log('Redirecting to dashboard...')
      
      // Handle redirection - try both methods for redundancy
      try {
        // Method 1: Use setTimeout for redirection
        setTimeout(() => {
          const redirectPath = '/dashboard' // Always go to dashboard, no staff path
          console.log(`Redirecting to ${redirectPath}...`)
          router.push(redirectPath)
        }, 1000)
        
        // Method 2: Direct redirection as backup
        setTimeout(() => {
          if (document.location.pathname.includes('/login')) {
            console.log('Fallback redirection activated')
            document.location.href = '/dashboard'
          }
        }, 3000)
      } catch (redirectError) {
        console.error('Redirection error:', redirectError)
        // Last resort - direct URL change
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setError(err.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border border-cyan-500/30 bg-slate-800/60 shadow-xl shadow-cyan-900/20">
        <CardHeader>
          <CardTitle className="text-2xl font-light tracking-wider text-center" style={{ color: "#00FFFF", textShadow: "0 0 10px #00FFFF" }}>
            WATER BAR LOGIN
          </CardTitle>
          <CardDescription className="text-center text-slate-300">
            Welcome back to your hydration journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRegistered && (
            <Alert className="mb-6 bg-green-900/20 border-green-500/50 text-green-300">
              <AlertDescription>
                Registration successful! Please login with your new account.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input
                id="email"
                type="email"
                className="bg-slate-700/70 border-slate-600 text-slate-100"
                placeholder="your.email@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="bg-slate-700/70 border-slate-600 text-slate-100 pr-10"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-100"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
              )}
            </div>
            
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-300 rounded-md p-3 text-sm">
                {error}
              </div>
            )}
            
            {loginSuccess ? (
              <div className="space-y-4">
                <div className="bg-green-900/20 border border-green-500/50 text-green-300 rounded-md p-3 text-sm flex items-center">
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Login successful! Redirecting to dashboard...
                </div>
                
                <Button 
                  className="w-full bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30 py-6"
                  style={{ color: "#00FFFF" }}
                  onClick={() => router.push(userData?.isStaff ? "/staff" : "/dashboard")}
                >
                  <div className="flex items-center">
                    <Droplets className="h-5 w-5 mr-3" /> Go to {userData?.isStaff ? "Staff" : "User"} Dashboard
                  </div>
                </Button>
              </div>
            ) : (
              <Button 
                type="submit" 
                className="w-full bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30 py-6"
                disabled={isLoading}
                style={{ color: "#00FFFF" }}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in
                  </div>
                ) : (
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3" /> Login
                  </div>
                )}
              </Button>
            )}
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-slate-400 text-center w-full">
            Don&apos;t have an account?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto" 
              style={{ color: "#00FFFF" }}
              onClick={() => router.push("/register")}
            >
              Register now
            </Button>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
