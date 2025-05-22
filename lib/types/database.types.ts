// Database types based on the Supabase schema

export type User = {
  id: string
  email: string
  name?: string
  weight: number
  body_type: "muscular" | "average" | "stocky"
  created_at: string
  updated_at: string
}

export type HydrationEvent = {
  id: string
  user_id: string
  event_date: string
  event_time: string
  event_type: "water" | "electrolyte" | "protein" | "workout"
  amount_ml?: number
  amount_g?: number
  pre_weight?: number
  post_weight?: number
  description?: string
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
