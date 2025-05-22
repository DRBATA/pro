import type { HydrationEvent, Recommendation, Venue, Product } from "./types"

// Mock hydration events
export const mockHydrationEvents: HydrationEvent[] = [
  {
    id: "1",
    type: "water",
    name: "Water",
    amount: 250,
    time: new Date(new Date().setHours(8, 30, 0, 0)).toISOString(),
    details: {},
  },
  {
    id: "2",
    type: "drink",
    name: "Coffee",
    amount: 330,
    time: new Date(new Date().setHours(9, 15, 0, 0)).toISOString(),
    details: { caffeine: true },
  },
  {
    id: "3",
    type: "water",
    name: "Water",
    amount: 500,
    time: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
    details: {},
  },
  {
    id: "4",
    type: "food",
    name: "Watermelon",
    amount: 200,
    time: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(),
    details: { hydration: 90 },
  },
  {
    id: "5",
    type: "activity",
    name: "Running",
    amount: 0,
    time: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
    details: { duration: 45, intensity: "high" },
  },
]

// Mock recommendations
export const mockRecommendations: Recommendation[] = [
  {
    id: "1",
    time: "8:00 AM",
    name: "Water",
    amount: 500,
    note: "Start your day with hydration",
    completed: true,
  },
  {
    id: "2",
    time: "11:00 AM",
    name: "Electrolyte Drink",
    amount: 330,
    note: "Replenish minerals before lunch",
    completed: false,
  },
  {
    id: "3",
    time: "2:00 PM",
    name: "Water",
    amount: 250,
    completed: false,
  },
  {
    id: "4",
    time: "4:30 PM",
    name: "Chaga Infusion",
    amount: 200,
    note: "Boost your immune system",
    completed: false,
  },
  {
    id: "5",
    time: "7:00 PM",
    name: "Water",
    amount: 250,
    completed: false,
  },
]

// Mock venues
export const mockVenues: Venue[] = [
  {
    id: "1",
    name: "Water Bar Station",
    type: "Premium Water",
    distance: 150,
    offer: "Free refill with membership",
  },
  {
    id: "2",
    name: "FitLab Gym",
    type: "Electrolyte Station",
    distance: 300,
  },
  {
    id: "3",
    name: "Green Cafe",
    type: "Specialty Drinks",
    distance: 450,
    offer: "10% off with Water Bar app",
  },
]

// Mock products
export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Smart Water Bottle",
    description: "Tracks your hydration and reminds you to drink water",
    price: 39.99,
    image: "/placeholder-huq2c.png",
    rating: 4.8,
    tag: "Best Seller",
  },
  {
    id: "2",
    name: "Electrolyte Powder (30 pack)",
    description: "Sugar-free electrolyte mix for optimal hydration",
    price: 24.99,
    image: "/electrolyte-powder.png",
    rating: 4.6,
  },
  {
    id: "3",
    name: "Chaga Mushroom Tea",
    description: "Immune-boosting mushroom tea with antioxidants",
    price: 18.99,
    image: "/mushroom-tea.png",
    rating: 4.3,
  },
  {
    id: "4",
    name: "Insulated Tumbler",
    description: "Keeps drinks cold for 24 hours or hot for 12 hours",
    price: 29.99,
    image: "/placeholder.svg?height=300&width=300&query=insulated+tumbler",
    rating: 4.9,
    tag: "New",
  },
]
