export type ActivityType =
  | "hiit"
  | "hot_yoga"
  | "run"
  | "work_laptop"
  | "zoom"
  | "desk"
  | "brunch"
  | "big_meal"
  | "sleep"
  | "late_screen"
  | "meditation"
  | "fasting"
  | "cycle"
  | "rest_day"

export type MoodType = "low" | "tight" | "foggy" | "energetic" | "balanced" | "stressed"

export type HydrationArchetype =
  | "post_sweat_cool"
  | "mental_fog"
  | "gut_rebalance"
  | "rest_reset"
  | "clean_energy"
  | "detox_gentle"

export type KitType =
  | "White Ember"
  | "Copper Whisper"
  | "Silver Mirage"
  | "Cold Halo"
  | "Echo Spiral"
  | "Iron Drift"
  | "Night Signal"
  | "Black Veil"
  | "Sky Salt"
  | "Morning Flow"
  | "Ghost Bloom"

export interface HydrationParams {
  activity: ActivityType
  time: string
  hydration_gap: boolean
  mood?: MoodType
}

// Simple deterministic hydration engine

// Map activities to hydration archetypes
export function getHydrationArchetype(activity: string, hydrationGap: boolean): string {
  if (["hiit", "hot_yoga", "run"].includes(activity) && hydrationGap) {
    return "post_sweat_cool"
  }
  if (["work_laptop", "zoom", "desk"].includes(activity) && hydrationGap) {
    return "mental_fog"
  }
  if (["brunch", "big_meal"].includes(activity)) {
    return "gut_rebalance"
  }
  if (["sleep", "late_screen"].includes(activity)) {
    return "rest_reset"
  }
  if (["meditation", "fasting"].includes(activity)) {
    return "clean_energy"
  }
  return "clean_energy"
}

// Map archetypes to kits
export const archetypeToKits: Record<HydrationArchetype, KitType[]> = {
  post_sweat_cool: ["White Ember", "Copper Whisper"],
  mental_fog: ["Silver Mirage", "Cold Halo"],
  gut_rebalance: ["Echo Spiral", "Iron Drift"],
  rest_reset: ["Night Signal", "Black Veil"],
  clean_energy: ["Sky Salt", "Morning Flow"],
  detox_gentle: ["Ghost Bloom", "White Ember"],
}

// Get a kit recommendation based on activity and hydration gap
export function getHydrationKit(activity: string, hydrationGap: boolean): string {
  const archetype = getHydrationArchetype(activity, hydrationGap)
  const kits = archetypeToKits[archetype] || []
  return kits.length > 0 ? kits[0] : "Sky Salt" // Default to Sky Salt if no match
}

export const kitDescriptions: Record<KitType, string> = {
  "White Ember": "Cooling post-workout recovery with electrolytes and a refreshing ritual",
  "Copper Whisper": "Muscle recovery blend with forearm flush ritual and mineral replenishment",
  "Silver Mirage": "Mental clarity boost with face and temple ritual for screen fatigue",
  "Cold Halo": "Vocal clarity and quick cooling ritual with magnesium-rich hydration",
  "Echo Spiral": "Heat-clearing ritual with digestive support and roundbody stroke technique",
  "Iron Drift": "Post-workout recovery with kombucha for gut-brain connection and cold stroke",
  "Night Signal": "Evening wind-down with chest stone ritual and chaga blend for restful sleep",
  "Black Veil": "Reset ritual with forearm technique and mineral-rich, sugar-free hydration",
  "Sky Salt": "Mineral focus blend for all-day smooth energy without sugar crash",
  "Morning Flow": "Gentle awakening ritual with balanced hydration for mindful mornings",
  "Ghost Bloom": "Feminine-coded balance with hibiscus kombucha and stillness ritual",
}

export const kitRituals: Record<KitType, string[]> = {
  "White Ember": [
    "Apply cool stone to back of neck",
    "Offer electrolyte-infused water at 55°F",
    "Perform gentle wrist rotation technique",
    "Finish with deep breathing exercise",
  ],
  "Copper Whisper": [
    "Begin with forearm flush technique",
    "Serve Perrier with electrolyte blend",
    "Apply pressure to key recovery points",
    "End with mineral-rich hydration shot",
  ],
  "Silver Mirage": [
    "Start with temple and face ritual",
    "Offer kombucha clarity blend",
    "Perform eye relief technique",
    "Finish with mental reset breathing",
  ],
  "Cold Halo": [
    "Apply cooling stones to throat area",
    "Serve magnesium-rich water blend",
    "Perform quick cooling ritual",
    "End with vocal clarity exercise",
  ],
  "Echo Spiral": [
    "Begin with heat-clearing ritual",
    "Offer digestive kombucha blend",
    "Perform roundbody stroke technique",
    "Finish with centered breathing",
  ],
  "Iron Drift": [
    "Start with cold stroke technique",
    "Serve kombucha with electrolytes",
    "Apply pressure to muscle recovery points",
    "End with grounding exercise",
  ],
  "Night Signal": [
    "Begin with chest stone placement",
    "Offer chaga wind-down blend",
    "Perform calming ritual sequence",
    "End with sleep preparation breathing",
  ],
  "Black Veil": [
    "Start with forearm reset technique",
    "Serve mineral-rich, sugar-free blend",
    "Perform nervous system calming ritual",
    "Finish with centering exercise",
  ],
  "Sky Salt": [
    "Begin with mineral focus ritual",
    "Offer balanced hydration blend",
    "Perform clarity technique",
    "End with energizing breathing",
  ],
  "Morning Flow": [
    "Start with gentle awakening ritual",
    "Serve balanced morning hydration",
    "Perform mindful technique sequence",
    "Finish with intention-setting",
  ],
  "Ghost Bloom": [
    "Begin with stillness ritual",
    "Offer hibiscus kombucha blend",
    "Perform feminine-coded balance technique",
    "End with gentle restoration breathing",
  ],
}

export const activityDescriptions: Record<ActivityType, string> = {
  hiit: "High-intensity interval training",
  hot_yoga: "Hot yoga session",
  run: "Running or jogging",
  work_laptop: "Working on laptop",
  zoom: "Video conferencing",
  desk: "Desk work",
  brunch: "Brunch or social meal",
  big_meal: "Large meal",
  sleep: "Sleep or rest",
  late_screen: "Late night screen time",
  meditation: "Meditation session",
  fasting: "Fasting period",
  cycle: "Menstrual cycle",
  rest_day: "Rest or recovery day",
}

export const moodDescriptions: Record<MoodType, string> = {
  low: "Low energy",
  tight: "Muscle tightness",
  foggy: "Mental fog",
  energetic: "Energetic",
  balanced: "Balanced",
  stressed: "Stressed",
}

export const archetypeDescriptions: Record<HydrationArchetype, string> = {
  post_sweat_cool: "Recovery after intense physical activity with cooling and electrolyte replenishment",
  mental_fog: "Mental clarity boost for screen fatigue and focus restoration",
  gut_rebalance: "Digestive support and rebalancing after meals or social events",
  rest_reset: "Evening wind-down and preparation for restful sleep",
  clean_energy: "Balanced, sustained energy without stimulants",
  detox_gentle: "Gentle cleansing and hormonal support",
}
