"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { User, Droplets } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loginUserClient } from "@/lib/client-auth"

// Form validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
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

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setError(null)
    
    try {
      // Login user with Supabase using client-safe function
      const { user, isStaff, error } = await loginUserClient(data.email, data.password)

      if (error) {
        setError(error)
        return
      }

      // Login successful - show success message and dashboard button
      setLoginSuccess(true)
      setUserData({ isStaff: isStaff || false })
      // Store user data in local storage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('userLoggedIn', 'true')
        localStorage.setItem('userIsStaff', isStaff ? 'true' : 'false')
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
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
              <Input
                id="password"
                type="password"
                className="bg-slate-700/70 border-slate-600 text-slate-100"
                placeholder="••••••••"
                {...form.register("password")}
              />
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
                  Login successful! You can now access your dashboard.
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
