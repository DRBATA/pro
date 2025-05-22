import { type HydrationArchetype, type KitType, archetypeToKits } from "./hydration-engine"

// Define activity types that map to archetypes
const activityToArchetype: Record<string, HydrationArchetype> = {
  // Post-sweat activities
  hiit: "post_sweat_cool",
  hot_yoga: "post_sweat_cool",
  run: "post_sweat_cool",
  gym: "post_sweat_cool",

  // Mental fog activities
  work_laptop: "mental_fog",
  zoom: "mental_fog",
  desk: "mental_fog",
  coding: "mental_fog",

  // Gut rebalance activities
  brunch: "gut_rebalance",
  big_meal: "gut_rebalance",
  dinner: "gut_rebalance",
  social: "gut_rebalance",

  // Rest reset activities
  sleep: "rest_reset",
  late_screen: "rest_reset",
  evening: "rest_reset",

  // Clean energy activities
  meditation: "clean_energy",
  fasting: "clean_energy",
  morning: "clean_energy",

  // Detox gentle activities
  cycle: "detox_gentle",
  rest_day: "detox_gentle",
  recovery: "detox_gentle",
}

// Factors that influence kit selection
interface HydrationFactors {
  activity?: string
  time?: string // 24-hour format
  hydrationGap?: boolean
  mood?: string
  sweatLoss?: number // in ml
  preExistingCondition?: string
}

// Calculate kit match score (0-100) based on factors
function calculateKitScore(kit: KitType, factors: HydrationFactors): number {
  let score = 0
  const maxScore = 100

  // Determine primary archetype from activity
  let primaryArchetype: HydrationArchetype | null = null
  if (factors.activity && activityToArchetype[factors.activity]) {
    primaryArchetype = activityToArchetype[factors.activity]

    // Check if kit is recommended for this archetype
    const recommendedKits = archetypeToKits[primaryArchetype]
    if (recommendedKits.includes(kit)) {
      score += 60 // Base score for matching archetype
    }
  }

  // Time of day adjustments
  if (factors.time) {
    const hour = Number.parseInt(factors.time.split(":")[0])

    // Morning kits (6am-11am)
    if (hour >= 6 && hour < 11) {
      if (kit === "Morning Flow" || kit === "Sky Salt") {
        score += 10
      }
    }
    // Afternoon kits (11am-5pm)
    else if (hour >= 11 && hour < 17) {
      if (kit === "White Ember" || kit === "Silver Mirage" || kit === "Echo Spiral") {
        score += 10
      }
    }
    // Evening kits (5pm-10pm)
    else if (hour >= 17 && hour < 22) {
      if (kit === "Copper Whisper" || kit === "Iron Drift") {
        score += 10
      }
    }
    // Night kits (10pm-6am)
    else {
      if (kit === "Night Signal" || kit === "Black Veil") {
        score += 10
      }
    }
  }

  // Hydration gap adjustments
  if (factors.hydrationGap) {
    if (kit === "White Ember" || kit === "Silver Mirage") {
      score += 10
    }
  }

  // Mood adjustments
  if (factors.mood) {
    if (factors.mood === "low" && (kit === "Ghost Bloom" || kit === "Sky Salt")) {
      score += 10
    }
    if (factors.mood === "tight" && (kit === "Copper Whisper" || kit === "Iron Drift")) {
      score += 10
    }
    if (factors.mood === "foggy" && (kit === "Silver Mirage" || kit === "Cold Halo")) {
      score += 10
    }
  }

  // Sweat loss adjustments
  if (factors.sweatLoss && factors.sweatLoss > 500) {
    if (kit === "White Ember" || kit === "Copper Whisper") {
      score += 10
    }
  }

  // Cap score at 100
  return Math.min(score, maxScore)
}

// Get kit recommendations for a specific archetype
export function getKitRecommendation(archetype: HydrationArchetype): Record<KitType, number> {
  const allKits = [
    "White Ember",
    "Copper Whisper",
    "Silver Mirage",
    "Cold Halo",
    "Echo Spiral",
    "Iron Drift",
    "Night Signal",
    "Black Veil",
    "Sky Salt",
    "Morning Flow",
    "Ghost Bloom",
  ] as KitType[]

  const result: Record<KitType, number> = {} as Record<KitType, number>

  // Calculate scores for all kits
  allKits.forEach((kit) => {
    let score = 0

    // Primary match for archetype
    if (archetypeToKits[archetype].includes(kit)) {
      score = 100 // Perfect match
    } else {
      // Secondary matches based on complementary properties
      if (archetype === "post_sweat_cool" && (kit === "Silver Mirage" || kit === "Iron Drift")) {
        score = 40
      } else if (archetype === "mental_fog" && (kit === "Sky Salt" || kit === "Morning Flow")) {
        score = 40
      } else if (archetype === "gut_rebalance" && kit === "Ghost Bloom") {
        score = 40
      } else if (archetype === "rest_reset" && kit === "Ghost Bloom") {
        score = 40
      } else if (archetype === "clean_energy" && kit === "Cold Halo") {
        score = 40
      } else if (archetype === "detox_gentle" && kit === "Echo Spiral") {
        score = 40
      } else {
        score = 20 // Base score for non-matches
      }
    }

    result[kit] = score
  })

  return result
}

// Get kit recommendations based on timeline events
export function getKitRecommendationFromEvents(events: HydrationFactors[]): Record<KitType, number> {
  const allKits = [
    "White Ember",
    "Copper Whisper",
    "Silver Mirage",
    "Cold Halo",
    "Echo Spiral",
    "Iron Drift",
    "Night Signal",
    "Black Veil",
    "Sky Salt",
    "Morning Flow",
    "Ghost Bloom",
  ] as KitType[]

  const result: Record<KitType, number> = {} as Record<KitType, number>

  // Calculate scores for all kits based on all events
  allKits.forEach((kit) => {
    let totalScore = 0

    events.forEach((event) => {
      totalScore += calculateKitScore(kit, event)
    })

    // Average the scores across events
    result[kit] = Math.round(totalScore / events.length)
  })

  return result
}

// Get the best kit recommendation based on timeline events
export function getBestKitRecommendation(events: HydrationFactors[]): KitType {
  const scores = getKitRecommendationFromEvents(events)

  // Find the kit with the highest score
  let bestKit: KitType = "Sky Salt" // Default
  let highestScore = 0

  Object.entries(scores).forEach(([kit, score]) => {
    if (score > highestScore) {
      highestScore = score
      bestKit = kit as KitType
    }
  })

  return bestKit
}
