// Database types based on the Supabase schema

// User type for authentication and profile management
export type User = Database['public']['Tables']['users']['Row'];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
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
        Insert: {
          id?: string
          email: string
          name?: string
          weight?: number
          sex?: "male" | "female"
          body_type?: string
          phone_number?: string
          contact_preference?: "email" | "whatsapp" | "phone" | "text"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          weight?: number
          sex?: "male" | "female"
          body_type?: string
          phone_number?: string
          contact_preference?: "email" | "whatsapp" | "phone" | "text"
          created_at?: string
          updated_at?: string
        }
      }
      
      // Legacy tables - might be migrated or deprecated
      hydration_events: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          event_date: string
          event_time: string
          event_type: "water" | "electrolyte" | "protein" | "workout" | "food"
          amount?: number
          amount_ml?: number
          amount_g?: number
          pre_weight?: number
          post_weight?: number
          description?: string
          activity_type?: string
          intensity?: "light" | "moderate" | "intense"
          duration?: number
          food_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_date?: string
          event_time?: string
          event_type?: "water" | "electrolyte" | "protein" | "workout" | "food"
          amount?: number
          amount_ml?: number
          amount_g?: number
          pre_weight?: number
          post_weight?: number
          description?: string
          activity_type?: string
          intensity?: "light" | "moderate" | "intense"
          duration?: number
          food_type?: string
          created_at?: string
        }
      }
      
      daily_targets: {
        Row: {
          id: string
          user_id: string
          target_date: string
          water_ml: number
          protein_g: number
          sodium_mg: number
          potassium_mg: number
          calculated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_date: string
          water_ml: number
          protein_g: number
          sodium_mg: number
          potassium_mg: number
          calculated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_date?: string
          water_ml?: number
          protein_g?: number
          sodium_mg?: number
          potassium_mg?: number
          calculated_at?: string
        }
      }
      
      hydration_kits: {
        Row: {
          id: string
          name: string
          description?: string
          ritual_steps: string[]
          ingredients: Record<string, any>
          archetype: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          ritual_steps: string[]
          ingredients: Record<string, any>
          archetype: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          ritual_steps?: string[]
          ingredients?: Record<string, any>
          archetype?: string
          created_at?: string
        }
      }
      
      orders: {
        Row: {
          id: string
          user_id: string
          kit_id: string
          status: "pending" | "in-progress" | "completed"
          location?: string
          notes?: string
          ordered_at: string
          completed_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          kit_id: string
          status?: "pending" | "in-progress" | "completed"
          location?: string
          notes?: string
          ordered_at?: string
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kit_id?: string
          status?: "pending" | "in-progress" | "completed"
          location?: string
          notes?: string
          ordered_at?: string
          completed_at?: string
        }
      }
      
      user_credits: {
        Row: {
          id: string
          user_id: string
          balance: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          updated_at?: string
        }
      }
      
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          transaction_type: 'purchase' | 'redemption' | 'refund' | 'bonus'
          description?: string
          kit_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          transaction_type: 'purchase' | 'redemption' | 'refund' | 'bonus'
          description?: string
          kit_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          transaction_type?: 'purchase' | 'redemption' | 'refund' | 'bonus'
          description?: string
          kit_id?: string
          created_at?: string
        }
      }
      
      // New tables for the refactored hydration engine
      input_library: {
        Row: {
          id: string | number
          name: string
          category: string
          duration_min?: number
          ivf?: Record<string, any>  // JSON format for compartment data
          isf?: Record<string, any>
          icf?: Record<string, any>
          "4CF"?: Record<string, any>
          hormones?: Record<string, any>
          description?: string
          protein_g?: number
        }
        Insert: {
          id?: string | number
          name: string
          category: string
          duration_min?: number
          ivf?: Record<string, any>
          isf?: Record<string, any>
          icf?: Record<string, any>
          "4CF"?: Record<string, any>
          hormones?: Record<string, any>
          description?: string
          protein_g?: number
        }
        Update: {
          id?: string | number
          name?: string
          category?: string
          duration_min?: number
          ivf?: Record<string, any>
          isf?: Record<string, any>
          icf?: Record<string, any>
          "4CF"?: Record<string, any>
          hormones?: Record<string, any>
          description?: string
          protein_g?: number
        }
      }
      
      hydration_plans: {
        Row: {
          id: string
          user_id: string
          scheduled_at: string
          input_item_id: string | number
          quantity: number
          fulfilled: boolean
          fulfilled_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          scheduled_at: string
          input_item_id: string | number
          quantity?: number
          fulfilled?: boolean
          fulfilled_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          scheduled_at?: string
          input_item_id?: string | number
          quantity?: number
          fulfilled?: boolean
          fulfilled_at?: string
          created_at?: string
        }
      }
      
      hydration_logs: {
        Row: {
          id: string
          user_id: string
          logged_at: string
          input_item_id: string | number
          quantity: number
          plan_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          logged_at: string
          input_item_id: string | number
          quantity?: number
          plan_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          logged_at?: string
          input_item_id?: string | number
          quantity?: number
          plan_id?: string
          created_at?: string
        }
      }
      
      activity_logs: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          intensity: string
          duration_minutes: number
          started_at: string
          outdoor: boolean
          temperature_celsius?: number
          humidity_percent?: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          intensity?: string
          duration_minutes?: number
          started_at: string
          outdoor?: boolean
          temperature_celsius?: number
          humidity_percent?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          intensity?: string
          duration_minutes?: number
          started_at?: string
          outdoor?: boolean
          temperature_celsius?: number
          humidity_percent?: number
          created_at?: string
        }
      }
    }
    
    Views: {
      input_library_totals: {
        Row: {
          id: string | number
          name: string
          category: string
          duration_min?: number
          water_volume_ml: number
          protein_g: number
          sodium_mg: number
          potassium_mg: number
          description?: string
        }
      }
      
      daily_timeline: {
        Row: {
          type: 'plan' | 'log' | 'activity'
          id: string
          user_id: string
          timestamp: string
          item_name: string
          item_category: string
          quantity: number
          fulfilled: boolean
          fulfilled_at?: string
        }
      }
      
      daily_hydration_summary: {
        Row: {
          user_id: string
          day: string
          total_water_ml: number
          total_sodium_mg: number
          total_potassium_mg: number
          total_protein_g: number
          activities: string
          total_activity_minutes: number
          had_outdoor_activity: boolean
          max_temperature?: number
        }
      }
    }
  }
}
