// Database types based on the Supabase schema

export type User = {
  id: string
  email: string
  name?: string
  weight: number
  sex: "male" | "female"
  body_type: "muscular" | "average" | "stocky" | "toned" | "curvy" // Different options based on sex
  phone_number?: string
  contact_preference?: "email" | "whatsapp" | "phone" | "text"
  created_at: string
  updated_at: string
}

export type HydrationEvent = {
  id: string
  user_id: string
  event_date: string
  event_time: string
  event_type: "water" | "electrolyte" | "protein" | "workout" | "food"
  amount?: number // General amount field (ml for liquids, g for solids)
  amount_ml?: number // Deprecated: use amount instead
  amount_g?: number // Deprecated: use amount instead
  pre_weight?: number
  post_weight?: number
  description?: string
  activity_type?: string // Type of activity for workout events
  intensity?: "light" | "moderate" | "intense" // Intensity of workout
  duration?: number // Duration in minutes
  food_type?: string // Type of food for food events
  created_at: string
}

export type DailyTarget = {
  id: string
  user_id: string
  target_date: string
  water_ml: number
  protein_g: number
  sodium_mg: number
  potassium_mg: number
  calculated_at: string
}

export type HydrationKit = {
  id: string
  name: string
  description?: string
  ritual_steps: string[]
  ingredients: Record<string, any>
  archetype: string
  created_at: string
}

export type Order = {
  id: string
  user_id: string
  kit_id: string
  status: "pending" | "in-progress" | "completed"
  location?: string
  notes?: string
  ordered_at: string
  completed_at?: string
}

// Database interface that groups all types
export interface Database {
  users: User
  hydration_events: HydrationEvent
  daily_targets: DailyTarget
  hydration_kits: HydrationKit
  orders: Order
}
