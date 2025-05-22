"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { registerUser } from "@/lib/database-functions"

// Form validation schema
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  weight: z.coerce.number().min(20, "Weight must be at least 20kg").max(250, "Weight must be less than 250kg"),
  bodyType: z.enum(["muscular", "average", "stocky"], {
    invalid_type_error: "Please select a body type",
  }),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      weight: undefined,
      bodyType: undefined,
    },
  })

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true)
    setError(null)
    
    try {
      // Register user with Supabase
      const { user, error } = await registerUser(
        data.email, 
        data.password, 
        data.name, 
        data.weight, 
        data.bodyType
      )

      if (error) {
        setError(error)
        return
      }

      // Registration successful - redirect to login
      router.push("/login?registered=true")
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
            CREATE ACCOUNT
          </CardTitle>
          <CardDescription className="text-center text-slate-300">
            Join Water Bar and start your hydration journey
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">Full Name</Label>
              <Input
                id="name"
                type="text"
                className="bg-slate-700/70 border-slate-600 text-slate-100"
                placeholder="Your name"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-red-400 text-sm">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-slate-200">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                className="bg-slate-700/70 border-slate-600 text-slate-100"
                placeholder="70"
                {...form.register("weight")}
              />
              {form.formState.errors.weight && (
                <p className="text-red-400 text-sm">{form.formState.errors.weight.message}</p>
              )}
            </div>
            
            <div className="space-y-3">
              <Label className="text-slate-200">Body Type</Label>
              <RadioGroup 
                className="flex space-x-2"
                onValueChange={(value) => form.setValue("bodyType", value as "muscular" | "average" | "stocky")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="muscular" id="muscular" className="border-cyan-500" />
                  <Label htmlFor="muscular" className="text-slate-200">Muscular</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="average" id="average" className="border-cyan-500" />
                  <Label htmlFor="average" className="text-slate-200">Average</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stocky" id="stocky" className="border-cyan-500" />
                  <Label htmlFor="stocky" className="text-slate-200">Stocky</Label>
                </div>
              </RadioGroup>
              {form.formState.errors.bodyType && (
                <p className="text-red-400 text-sm">{form.formState.errors.bodyType.message}</p>
              )}
            </div>
            
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-300 rounded-md p-3 text-sm">
                {error}
              </div>
            )}
            
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
                  Processing
                </div>
              ) : (
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3" /> Create Account
                </div>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-slate-400 text-center w-full">
            Already have an account?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto" 
              style={{ color: "#00FFFF" }}
              onClick={() => router.push("/login")}
            >
              Log in
            </Button>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
