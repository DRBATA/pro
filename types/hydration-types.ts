// Hydration Plan type
export interface HydrationPlan {
  goal_ml: number
  remaining_ml: number
  current_ml: number
  percent_complete: number
  advice: string
  recommendations?: Array<{
    id: string
    name: string
    amount: number
    time: string
    completed: boolean
    color: string
  }>
  nutrition?: NutritionState
}

// Nutrition State type
export interface NutritionState {
  sodium_mg: { current: number; target: number }
  potassium_mg: { current: number; target: number }
  magnesium_mg: { current: number; target: number }
}

// Venue type
export interface Venue {
  id: string
  name: string
  coordinates: { latitude: number; longitude: number }
  type: "water" | "electrolyte" | "food"
  offer: {
    title: string
    voucher: string | null
  } | null
  menu: {
    item: string
    meets: string
  } | null
  distance: number
}

// Carbon Savings type
export interface CarbonSavings {
  total_kg_saved: number
  bottles_saved: number
  trees_equivalent: number
  recent_saving?: {
    amount_kg: number
    timestamp: string
  }
}
