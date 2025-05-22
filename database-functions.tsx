"use client"

// This file contains utility functions for interacting with your local database
// These are just examples - you would need to adapt them to your specific database setup

// Type definitions
export type User = {
  id: string
  name: string
  weight: number // in kg
  height: number // in cm
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active"
  hydrationGoal?: number // in mL
}

export type HydrationEntry = {
  id: string
  userId: string
  timestamp: Date
  drinkType: string
  amount: number // in mL
  electrolytes?: {
    sodium?: number // in mg
    potassium?: number // in mg
    magnesium?: number // in mg
  }
}

export type ActivityEntry = {
  id: string
  userId: string
  timestamp: Date
  activityType: string
  duration: number // in minutes
  intensity: "low" | "moderate" | "high"
}

export type WeatherData = {
  temperature: number // in celsius
  humidity: number // in percentage
  conditions: string
}

// Function to get user profile
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    // This would be replaced with your actual database call
    // Example: return await db.users.findUnique({ where: { id: userId } })

    // Simulated response
    return {
      id: userId,
      name: "John Doe",
      weight: 75,
      height: 180,
      activityLevel: "moderate",
      hydrationGoal: 2500,
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

// Function to log a hydration entry
export async function logHydration(entry: Omit<HydrationEntry, "id">): Promise<HydrationEntry | null> {
  try {
    // This would be replaced with your actual database call
    // Example: return await db.hydrationEntries.create({ data: entry })

    // Simulated response
    return {
      id: Date.now().toString(),
      ...entry,
    }
  } catch (error) {
    console.error("Error logging hydration:", error)
    return null
  }
}

// Function to get today's hydration entries
export async function getTodayHydration(userId: string): Promise<HydrationEntry[]> {
  try {
    // This would be replaced with your actual database call
    // Example:
    // const today = new Date()
    // today.setHours(0, 0, 0, 0)
    // return await db.hydrationEntries.findMany({
    //   where: {
    //     userId,
    //     timestamp: { gte: today }
    //   }
    // })

    // Simulated response
    return [
      {
        id: "1",
        userId,
        timestamp: new Date(new Date().setHours(8, 30)),
        drinkType: "Water",
        amount: 250,
      },
      {
        id: "2",
        userId,
        timestamp: new Date(new Date().setHours(10, 15)),
        drinkType: "Coffee",
        amount: 200,
      },
      {
        id: "3",
        userId,
        timestamp: new Date(new Date().setHours(12, 45)),
        drinkType: "Water",
        amount: 500,
      },
      {
        id: "4",
        userId,
        timestamp: new Date(new Date().setHours(15, 20)),
        drinkType: "Sports Drink",
        amount: 330,
        electrolytes: {
          sodium: 120,
          potassium: 80,
        },
      },
    ]
  } catch (error) {
    console.error("Error fetching today's hydration:", error)
    return []
  }
}

// Function to log an activity
export async function logActivity(entry: Omit<ActivityEntry, "id">): Promise<ActivityEntry | null> {
  try {
    // This would be replaced with your actual database call
    // Example: return await db.activityEntries.create({ data: entry })

    // Simulated response
    return {
      id: Date.now().toString(),
      ...entry,
    }
  } catch (error) {
    console.error("Error logging activity:", error)
    return null
  }
}

// Function to get today's activities
export async function getTodayActivities(userId: string): Promise<ActivityEntry[]> {
  try {
    // This would be replaced with your actual database call
    // Example:
    // const today = new Date()
    // today.setHours(0, 0, 0, 0)
    // return await db.activityEntries.findMany({
    //   where: {
    //     userId,
    //     timestamp: { gte: today }
    //   }
    // })

    // Simulated response
    return [
      {
        id: "1",
        userId,
        timestamp: new Date(new Date().setHours(7, 0)),
        activityType: "Running",
        duration: 30,
        intensity: "moderate",
      },
    ]
  } catch (error) {
    console.error("Error fetching today's activities:", error)
    return []
  }
}

// Function to get current weather data
export async function getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
  try {
    // This would be replaced with your actual weather API call
    // Example: return await fetch(`https://api.weather.com/...`)

    // Simulated response
    return {
      temperature: 28,
      humidity: 65,
      conditions: "Sunny",
    }
  } catch (error) {
    console.error("Error fetching weather data:", error)
    return null
  }
}

// Function to calculate hydration needs based on user profile, activities, and weather
export function calculateHydrationNeeds(
  user: User,
  activities: ActivityEntry[],
  weather?: WeatherData | null,
): {
  baseLine: number
  activityAdjustment: number
  weatherAdjustment: number
  total: number
} {
  // Base hydration needs (in mL)
  // Simple formula: 35mL per kg of body weight
  const baseLine = user.weight * 35

  // Activity adjustment
  let activityAdjustment = 0
  activities.forEach((activity) => {
    // Calculate based on duration and intensity
    const intensityFactor = activity.intensity === "low" ? 5 : activity.intensity === "moderate" ? 8 : 12 // high intensity

    activityAdjustment += (activity.duration / 30) * intensityFactor * 100
  })

  // Weather adjustment
  let weatherAdjustment = 0
  if (weather) {
    // Adjust for hot weather
    if (weather.temperature > 25) {
      weatherAdjustment += (weather.temperature - 25) * 50
    }

    // Adjust for humidity
    if (weather.humidity > 60) {
      weatherAdjustment += (weather.humidity - 60) * 5
    }
  }

  // Total hydration needs
  const total = Math.round(baseLine + activityAdjustment + weatherAdjustment)

  return {
    baseLine,
    activityAdjustment,
    weatherAdjustment,
    total,
  }
}

// Function to generate hydration recommendations
export function generateHydrationRecommendations(
  user: User,
  currentIntake: number,
  totalNeeds: number,
  currentTime = new Date(),
): Array<{ drinkType: string; amount: number; time: string }> {
  const remaining = totalNeeds - currentIntake

  if (remaining <= 0) {
    return []
  }

  const recommendations = []
  let amountLeft = remaining

  // Current hour
  const currentHour = currentTime.getHours()

  // Assume sleep time is 10 PM (22:00)
  const sleepHour = 22

  // Hours left until sleep
  const hoursLeft = Math.max(1, sleepHour - currentHour)

  // Distribute remaining amount across hours left
  const amountPerHour = amountLeft / hoursLeft

  // Generate recommendations
  for (let i = 0; i < hoursLeft; i++) {
    const hour = currentHour + i

    // Skip if we've already allocated all the remaining amount
    if (amountLeft <= 0) break

    // Determine drink type based on time of day and remaining amount
    let drinkType = "Water"
    let amount = Math.min(250, amountLeft) // Default to water, 250mL

    // If it's afternoon and we have a significant amount left, suggest an electrolyte drink
    if (hour >= 12 && hour < 17 && amountLeft > 500 && i === 1) {
      drinkType = "Electrolyte Drink"
      amount = 330
    }

    // Format the time
    const timeHour = hour % 12 || 12
    const amPm = hour < 12 ? "AM" : "PM"
    const timeString = i === 0 ? "Now" : `${timeHour}:00 ${amPm}`

    recommendations.push({
      drinkType,
      amount,
      time: timeString,
    })

    amountLeft -= amount
  }

  return recommendations
}
