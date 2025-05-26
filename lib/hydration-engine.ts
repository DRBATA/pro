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

// Body fat percentages by sex and body type
export const BODY_FAT_PERCENTAGES = {
  male: {
    muscular: 0.10,  // 10% for muscular men
    average: 0.22,   // 22% for average men
    stocky: 0.34,    // 34% for stocky men
  },
  female: {
    toned: 0.18,     // 18% for toned women
    average: 0.28,   // 28% for average women
    curvy: 0.40,     // 40% for curvy women
  }
}

// Get appropriate body type options based on sex
export function getBodyTypeOptions(sex: 'male' | 'female') {
  if (sex === 'male') {
    return [
      { value: 'muscular', label: 'Muscular' },
      { value: 'average', label: 'Average' },
      { value: 'stocky', label: 'Stocky' }
    ];
  } else {
    return [
      { value: 'toned', label: 'Toned' },
      { value: 'average', label: 'Average' },
      { value: 'curvy', label: 'Curvy' }
    ];
  }
}

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

// Activity intensity levels for water loss calculations
export type ActivityIntensity = 'light' | 'moderate' | 'intense';

// Activity context for nutritional requirements
export type ActivityContext = 'baseline' | 'active' | 'fasting' | 'high_sweat';

// Base water loss rates by activity (ml per minute)
export const ACTIVITY_WATER_LOSS: Record<string, number> = {
  // Sedentary activities (mostly baseline losses)
  desk: 0.5,
  work_laptop: 0.5,
  zoom: 0.6,  // Slightly higher due to talking
  sleep: 0.4,
  rest_day: 0.5,
  meditation: 0.5,
  late_screen: 0.5,
  
  // Light activities
  brunch: 0.7,  // Digestive activity increases water loss
  big_meal: 0.8,
  cycle: 2.0,   // Light cycling
  
  // Moderate to intense activities
  run: 8.0,     // Base rate for running
  hiit: 12.0,   // Base rate for HIIT
  hot_yoga: 10.0 // Base rate for hot yoga
};

// Intensity multipliers for activities that can vary in intensity
export const INTENSITY_MULTIPLIERS = {
  light: 0.7,      // 70% of base rate
  moderate: 1.0,   // Base rate
  intense: 1.5     // 150% of base rate
};

// Fluid content percentages for common food types
export const FOOD_WATER_CONTENT: Record<string, number> = {
  fruits: 0.85,      // 85% water content
  vegetables: 0.90,  // 90% water content
  soup: 0.92,        // 92% water content
  yogurt: 0.85,      // 85% water content
  rice: 0.70,        // 70% water content
  pasta: 0.65,       // 65% water content
  bread: 0.35,       // 35% water content
  meat: 0.60,        // 60% water content
  fish: 0.70,        // 70% water content
  eggs: 0.75         // 75% water content
};

/**
 * Calculate hydration gap based on user's body composition, activity, and intake
 * 
 * @param weight User's weight in kg
 * @param sex User's biological sex ('male' or 'female')
 * @param bodyType User's body type
 * @param activity Type of activity
 * @param activityDuration Duration of activity in minutes
 * @param activityIntensity Intensity of the activity
 * @param waterIntake Water consumed in ml
 * @param foodIntake Array of food items consumed with amounts in grams
 * @returns Hydration gap in ml (positive means deficit, negative means excess)
 */
export function calculateHydrationGap(
  weight: number,
  sex: 'male' | 'female',
  bodyType: string,
  activity: string,
  activityDuration: number,
  activityIntensity: ActivityIntensity = 'moderate',
  waterIntake: number,
  foodIntake: Array<{food: string, amount: number}> = []
): {
  hydrationGap: number,
  context: ActivityContext,
  leanBodyMass: number,
  waterLoss: number,
  waterFromFood: number,
  totalWaterInput: number,
  recommendedIntake: number
} {
  // 1. Calculate lean body mass based on sex and body type
  let bodyFatPercentage: number;
  
  // Safe type checking for body type lookup
  if (sex === 'male') {
    // For male body types
    if (bodyType === 'muscular' || bodyType === 'average' || bodyType === 'stocky') {
      bodyFatPercentage = BODY_FAT_PERCENTAGES.male[bodyType];
    } else {
      bodyFatPercentage = BODY_FAT_PERCENTAGES.male.average; // Default
    }
  } else {
    // For female body types
    if (bodyType === 'toned' || bodyType === 'average' || bodyType === 'curvy') {
      bodyFatPercentage = BODY_FAT_PERCENTAGES.female[bodyType];
    } else {
      bodyFatPercentage = BODY_FAT_PERCENTAGES.female.average; // Default
    }
  }
  
  const leanBodyMass = weight * (1 - bodyFatPercentage);
  
  // 2. Determine activity context
  let context: ActivityContext = 'baseline';
  if (['hiit', 'hot_yoga', 'run'].includes(activity)) {
    context = activityIntensity === 'intense' ? 'high_sweat' : 'active';
  } else if (activity === 'fasting') {
    context = 'fasting';
  }
  
  // 3. Calculate water loss based on activity, duration, and intensity
  const baseWaterLossRate = activity in ACTIVITY_WATER_LOSS ? ACTIVITY_WATER_LOSS[activity] : 0.5; // Default to desk rate if not found
  const intensityMultiplier = INTENSITY_MULTIPLIERS[activityIntensity];
  const waterLoss = baseWaterLossRate * activityDuration * intensityMultiplier;
  
  // 4. Calculate water from food
  let waterFromFood = 0;
  foodIntake.forEach(item => {
    const waterContent = item.food in FOOD_WATER_CONTENT ? FOOD_WATER_CONTENT[item.food] : 0.5; // Default to 50% if not found
    waterFromFood += item.amount * waterContent;
  });
  
  // 5. Calculate total water input
  const totalWaterInput = waterIntake + waterFromFood;
  
  // 6. Calculate recommended intake based on context and lean body mass
  let recommendedMlPerKgLBM = 30; // Baseline
  
  switch (context) {
    case 'active':
      recommendedMlPerKgLBM = 45; // Average of 40-50ml/kg LBM for active
      break;
    case 'fasting':
      recommendedMlPerKgLBM = 45; // Average of 40-50ml/kg LBM for fasting
      break;
    case 'high_sweat':
      recommendedMlPerKgLBM = 55; // Above 50ml/kg LBM for high sweat
      break;
    default: // baseline
      recommendedMlPerKgLBM = 30;
  }
  
  const recommendedIntake = recommendedMlPerKgLBM * leanBodyMass;
  
  // 7. Calculate hydration gap (positive means deficit)
  const hydrationGap = waterLoss - totalWaterInput;
  
  return {
    hydrationGap,
    context,
    leanBodyMass,
    waterLoss,
    waterFromFood,
    totalWaterInput,
    recommendedIntake
  };
}

// Get a kit recommendation based on activity and hydration gap
export function getHydrationKit(activity: string, hydrationGap: boolean): string {
  const archetype = getHydrationArchetype(activity, hydrationGap)

  // Return a specific kit based on the archetype
  switch (archetype) {
    case "post_sweat_cool":
      return "White Ember"
    case "mental_fog":
      return "Silver Mirage"
    case "gut_rebalance":
      return "Echo Spiral"
    case "rest_reset":
      return "Night Signal"
    case "clean_energy":
      return "Sky Salt"
    case "detox_gentle":
      return "Ghost Bloom"
    default:
      return "Sky Salt" // Default recommendation
  }
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
