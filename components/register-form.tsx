"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { registerUserClient } from "@/lib/client-auth"
import { Eye, EyeOff } from "lucide-react"
import { User } from "lucide-react"
import { motion } from "framer-motion"
import { getBodyTypeOptions } from "@/lib/hydration-engine"

// Form validation schema
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  nickname: z.string().min(2, "Display name must be at least 2 characters").optional(),
  weight: z.coerce.number().min(20, "Weight must be at least 20kg").max(250, "Weight must be less than 250kg"),
  sex: z.enum(["male", "female"], {
    invalid_type_error: "Please select your biological sex",
  }),
  bodyType: z.string({
    required_error: "Please select a body type",
  }),
  phoneNumber: z.string().optional(),
  contactPreference: z.enum(["email", "whatsapp", "phone", "text"], {
    invalid_type_error: "Please select a contact preference",
  }),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [bodyTypeOptions, setBodyTypeOptions] = useState<{value: string, label: string}[]>([])

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      nickname: "",
      weight: undefined,
      sex: "male",
      bodyType: undefined,
      phoneNumber: "",
      contactPreference: "email",
    },
  })
  
  // Update body type options when sex changes
  useEffect(() => {
    const sex = form.watch("sex") as 'male' | 'female'
    const options = getBodyTypeOptions(sex)
    setBodyTypeOptions(options)
    
    // Set default body type based on sex when first loaded or when sex changes
    if (options.length > 0) {
      const defaultBodyType = sex === 'male' ? 'muscular' : 'toned'
      form.setValue("bodyType", defaultBodyType)
    }
  }, [form.watch("sex")])

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true)
    setError(null)
    
    try {
      // Register user with Supabase using client-safe function
      const { user, error } = await registerUserClient(
        data.email, 
        data.password, 
        data.name, 
        data.nickname || "", // Include the nickname
        data.weight, 
        data.sex,
        data.bodyType,
        data.phoneNumber || "",
        data.contactPreference
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="bg-slate-700/70 border-slate-600 text-slate-100 pr-10"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-slate-400 hover:text-slate-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
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
                placeholder="John Doe"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-red-400 text-sm">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-slate-200">Display Name (what you'd like to be known as)</Label>
              <Input
                id="nickname"
                type="text"
                className="bg-slate-700/70 border-slate-600 text-slate-100"
                placeholder="HydrationChamp"
                {...form.register("nickname")}
              />
              {form.formState.errors.nickname && (
                <p className="text-red-400 text-sm">{form.formState.errors.nickname.message}</p>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-200">Biological Sex</Label>
                  <span className="text-xs text-cyan-400 opacity-80">Used for precise body composition analysis</span>
                </div>
                <RadioGroup
                  value={form.watch("sex")}
                  onValueChange={(value) => {
                    form.setValue("sex", value as "male" | "female");
                    form.clearErrors("sex");
                  }}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" className="border-cyan-500" />
                    <Label htmlFor="male" className="text-sm">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" className="border-cyan-500" />
                    <Label htmlFor="female" className="text-sm">Female</Label>
                  </div>
                </RadioGroup>
                {form.formState.errors.sex && (
                  <p className="text-xs text-red-500">{form.formState.errors.sex.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-200">Body Type</Label>
                  <span className="text-xs text-cyan-400 opacity-80">Determines your lean body mass calculation</span>
                </div>
                <RadioGroup
                  value={form.watch("bodyType")}
                  onValueChange={(value) => {
                    form.setValue("bodyType", value);
                    form.clearErrors("bodyType");
                  }}
                  className="flex flex-col space-y-1"
                >
                  {bodyTypeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} className="border-cyan-500" />
                      <Label htmlFor={option.value} className="text-sm">{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {form.formState.errors.bodyType && (
                  <p className="text-xs text-red-500">{form.formState.errors.bodyType.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-slate-200">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                className="bg-slate-700/70 border-slate-600 text-slate-100"
                placeholder="+971 XX XXX XXXX"
                {...form.register("phoneNumber")}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Preferred Contact Method</Label>
              <RadioGroup
                value={form.watch("contactPreference")}
                onValueChange={(value) => {
                  form.setValue("contactPreference", value as "email" | "whatsapp" | "phone" | "text");
                  form.clearErrors("contactPreference");
                }}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email-contact" className="border-cyan-500" />
                  <Label htmlFor="email-contact" className="text-sm">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp" className="border-cyan-500" />
                  <Label htmlFor="whatsapp" className="text-sm">WhatsApp</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id="phone" className="border-cyan-500" />
                  <Label htmlFor="phone" className="text-sm">Phone Call</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="text" className="border-cyan-500" />
                  <Label htmlFor="text" className="text-sm">Text Message</Label>
                </div>
              </RadioGroup>
              {form.formState.errors.contactPreference && (
                <p className="text-xs text-red-500">{form.formState.errors.contactPreference.message}</p>
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
