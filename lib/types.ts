export interface HydrationEvent {
  id: string
  type: "water" | "drink" | "food" | "activity"
  name: string
  amount: number
  time: string
  details?: Record<string, any>
}

export interface Recommendation {
  id: string
  time: string
  name: string
  amount: number
  note?: string
  completed: boolean
}

export interface Venue {
  id: string
  name: string
  type: string
  distance: number
  offer?: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  rating: number
  tag?: string
}
