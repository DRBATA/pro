// @ts-nocheck
"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import { getOrCreateSession, calculateHydrationTargets } from '../../lib/session-manager';
import { BODY_FAT_PERCENTAGES } from '../../lib/hydration-engine';
import { motion } from "framer-motion"
import { Plus, Droplets, Dumbbell, Clock, Target, User, Settings, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/lib/user-context"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Label } from "@/components/ui/label"
import { SessionStatus } from "@/components/session-status"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  getUserDailyTimeline, 
  calculateUserHydrationGaps
} from "@/lib/hydration-data-functions"
import {
  getUserProfile,
  updateUserProfile
} from "@/lib/client-functions"
import { supabase } from "@/lib/supabase-client"

// Body type display mapping with type safety
const BODY_TYPES: Record<string, { name: string }> = {
  // Male body types
  muscular: { name: 'Muscular Build' },
  athletic: { name: 'Athletic Build' },
  stocky: { name: 'Stocky Build' },
  // Female body types
  toned: { name: 'Toned Build' },
  athletic_female: { name: 'Athletic Build' },
  curvy: { name: 'Curvy Build' },
  // Legacy types (for backward compatibility)
  low: { name: 'Low Body Fat' },
  average: { name: 'Average Build' },
  high: { name: 'High Body Fat' },
  // Default type for safety
  default: { name: 'Average Build' }
}

// Type definitions
type BodyType = 'muscular' | 'athletic' | 'stocky' | 'toned' | 'athletic_female' | 'curvy' | 'low' | 'average' | 'high' | 'default';
type HydrationEventType = "water" | "protein" | "electrolyte" | "workout" | "food";

// Safe function to get body type name
function getBodyTypeName(bodyType: string | undefined): string {
  if (!bodyType || !(bodyType in BODY_TYPES)) return BODY_TYPES.default.name;
  return BODY_TYPES[bodyType].name;
}

// UI models
interface HydrationEvent {
  id: string;
  time: string;
  type: HydrationEventType;
  amount?: number;
  description: string;
}

// Get color for event type
function getEventColor(type: string): string {
  switch (type) {
    case "water": return "#00FFFF" // Cyan
    case "protein": return "#FF6B9D" // Pink
    case "electrolyte": return "#9D8DF1" // Purple
    case "workout": return "#FFD166" // Yellow
    case "food": return "#06D6A0" // Green
    default: return "#FFFFFF" // White
  }
}

// Get icon for event type
function getEventIcon(type: string) {
  switch (type) {
    case "water": return <Droplets className="h-4 w-4" />
    case "protein": return <Target className="h-4 w-4" />
    case "electrolyte": return <Dumbbell className="h-4 w-4" />
    case "workout": return <Clock className="h-4 w-4" />
    case "food": return <Target className="h-4 w-4" />
    default: return <Plus className="h-4 w-4" />
  }
}

// Calculate hydration percentage for visualization
function hydrationPercentage(current: number, target: number): number {
  return Math.min(Math.round((current / target) * 100), 100);
}

// Main Dashboard Component
export default function Dashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { user } = useUser() // Use the UserContext for authentication
  const { toast } = useToast()
  
  // User profile state
  const [userProfile, setUserProfile] = useState<{
    weight: number;
    sex: 'male' | 'female';
    bodyType: BodyType;
    name?: string;
  }>({
    weight: 70,
    sex: 'male' as 'male' | 'female',
    bodyType: 'average' as BodyType,
    name: undefined,
  })
  
  // Timeline and events state
  const [events, setEvents] = useState<HydrationEvent[]>([])
  
  // Hydration data state
  const [dailyTarget, setDailyTarget] = useState({
    water_ml: 2500,
    protein_g: 70,
    sodium_mg: 2000,
    potassium_mg: 3500,
  })
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [hydrationGapData, setHydrationGapData] = useState<{
    hydrationGap: number,
    context: string,
    leanBodyMass: number,
    waterLoss: number,
    waterFromFood: number,
    totalWaterInput: number,
    recommendedIntake: number
  } | null>(null)
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [userNickname, setUserNickname] = useState('')
  
  // Form state
  const [newEvent, setNewEvent] = useState<{
    time: string; 
    type: HydrationEventType; 
    amount?: number; 
    description: string;
  }>({
    time: new Date().toTimeString().slice(0, 5),
    type: "water",
    amount: 0,
    description: ""
  })
  
  // State for user session
  const [sessionEmail, setSessionEmail] = useState<string>("");
  const [sessionLoading, setSessionLoading] = useState(true);
  
  // State for tracking hydration values
  const [waterIntake, setWaterIntake] = useState(0)
  const [waterRemaining, setWaterRemaining] = useState(0)
  const [proteinIntake, setProteinIntake] = useState(0)
  const [sodiumIntake, setSodiumIntake] = useState(0)
  const [potassiumIntake, setPotassiumIntake] = useState(0)
  
  // State for active hydration session
  const [activeSession, setActiveSession] = useState<any>(null);

  // Calculate lean body mass from profile
  const calculateLBM = (profile: any) => {
    const weight = profile.weight || 70; // Default to 70kg if not set
    const sex = profile.sex || 'male';
    const bodyType = profile.bodyType || 'average';
    
    // Calculate lean body mass using body fat percentage
    const bodyFatPercentage = 
      BODY_FAT_PERCENTAGES[sex]?.[bodyType] || 
      (sex === 'male' ? BODY_FAT_PERCENTAGES.male.average : BODY_FAT_PERCENTAGES.female.average);
    
    return weight * (1 - bodyFatPercentage);
  };
  
  // Function to calculate hydration targets based on user profile using LBM
  const calculateLocalHydrationTargets = (profile: any) => {
    try {
      console.log('Calculating user daily hydration summary with LBM:', profile);
      
      const weight = profile.weight || 70; // Default to 70kg if not set
      const sex = profile.sex || 'male';
      const bodyType = profile.bodyType || 'average';
      
      // Calculate lean body mass using body fat percentage
      // Fix type safety with proper type guards
      const bodyFatPercentage = 
        (sex === 'male' || sex === 'female') && 
        (bodyType && BODY_FAT_PERCENTAGES[sex]?.[bodyType as keyof typeof BODY_FAT_PERCENTAGES[typeof sex]]) ?
        BODY_FAT_PERCENTAGES[sex][bodyType as keyof typeof BODY_FAT_PERCENTAGES[typeof sex]] :
        (sex === 'male' ? BODY_FAT_PERCENTAGES.male.average : BODY_FAT_PERCENTAGES.female.average);
      
      const leanBodyMass = weight * (1 - bodyFatPercentage);
      
      // Get rates from session or use defaults
      const sodiumRate = activeSession?.sodium_rate_mg_per_kg || 25;
      const potassiumRate = activeSession?.potassium_rate_mg_per_kg || 57;
      const proteinRate = activeSession?.protein_rate_g_per_kg || 1.6;
      
      // Water always uses fixed 30ml/kg LBM as base
      const baseWater = Math.round(leanBodyMass * 30); // 30ml per kg LBM
      
      // Apply rates directly to LBM
      const baseSodium = Math.round(leanBodyMass * sodiumRate); 
      const basePotassium = Math.round(leanBodyMass * potassiumRate);
      const baseProtein = Math.round(leanBodyMass * proteinRate);
      
      console.log('Hydration targets calculated with LBM model:', {
        bodyType,
        bodyFatPercentage: Math.round(bodyFatPercentage * 100) + '%',
        leanBodyMass: Math.round(leanBodyMass),
        rates: {
          water: '30 ml/kg (fixed)',
          sodium: sodiumRate + ' mg/kg',
          potassium: potassiumRate + ' mg/kg',
          protein: proteinRate + ' g/kg'
        },
        results: {
          water: baseWater + ' ml',
          protein: baseProtein + ' g',
          sodium: baseSodium + ' mg',
          potassium: basePotassium + ' mg'
        }
      });
      
      // Update state with calculated values
      setWaterIntake(0); // Current intake (from timeline data)
      setWaterRemaining(baseWater); // Target
      setProteinIntake(baseProtein); // Target
      setSodiumIntake(baseSodium);
      setPotassiumIntake(basePotassium);
    } catch (error) {
      console.error('Error calculating hydration targets:', error);
    }
  }

  // Function to initialize or get the current hydration session
  const initializeSession = useCallback(async () => {
    if (!sessionEmail) return;
    
    try {
      // Get or create hydration session
      const session = await getOrCreateSession(sessionEmail);
      setActiveSession(session);
      console.log('Active hydration session:', session);
      
      // Calculate targets using the session
      if (userProfile) {
        calculateLocalHydrationTargets(userProfile);
        
        // Also calculate and save to database (this happens in background)
        calculateHydrationTargets(sessionEmail, session.id)
          .catch(err => console.error('Error saving hydration targets:', err));
      }
    } catch (error) {
      console.error('Error initializing hydration session:', error);
    }
  }, [sessionEmail, userProfile]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Timeline Sidebar */}
      <div className="w-80 h-screen sticky top-0 p-6 border-r border-cyan-400/20 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2
            className="text-xl font-medium"
            style={{
              color: "#00FFFF",
              textShadow: "0 0 10px #00FFFF60",
            }}
            >
              Today's Timeline
            </h2>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30"
                  style={{ color: "#00FFFF" }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-cyan-400/30">
                <DialogHeader>
                  <DialogTitle style={{ color: "#00FFFF" }}>Add Event</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-cyan-400">Time</Label>
                    <Input
                      type="time"
                      className="col-span-3 bg-slate-700 border-cyan-400/30"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-cyan-400">Type</Label>
                    <Select
                      value={newEvent.type}
                      onValueChange={(value) => setNewEvent({ ...newEvent, type: value as HydrationEventType })}
                    >
                      <SelectTrigger className="col-span-3 bg-slate-700 border-cyan-400/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-cyan-400/30">
                        <SelectItem value="water">Water</SelectItem>
                        <SelectItem value="electrolyte">Electrolyte</SelectItem>
                        <SelectItem value="protein">Protein</SelectItem>
                        <SelectItem value="workout">Workout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(newEvent.type === "water" || newEvent.type === "electrolyte" || newEvent.type === "protein") && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right text-cyan-400">Amount</Label>
                      <Input
                        type="number"
                        className="col-span-3 bg-slate-700 border-cyan-400/30"
                        placeholder={newEvent.type === "protein" ? "grams" : "ml"}
                        value={newEvent.amount || ""}
                        onChange={(e) => setNewEvent({ ...newEvent, amount: Number(e.target.value) })}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-cyan-400">Description</Label>
                    <Input
                      className="col-span-3 bg-slate-700 border-cyan-400/30"
                      placeholder="Optional description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  className="bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30"
                  style={{ color: "#00FFFF" }}
                  onClick={() => {
                    // TODO: Add event logic would go here
                    setShowAddModal(false);
                    toast({
                      title: "Event added",
                      description: "Your hydration event has been logged."
                    });
                  }}
                >
                  Add Event
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          {/* HydrationTimeline component - integrates with the user auth */}
          <Card className="bg-slate-800/50 border-slate-600 shadow-inner shadow-cyan-900/10 mb-4">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading timeline...</span>
                </div>
              ) : sessionEmail ? (
                // If we have a session email, we are logged in
                <HydrationTimeline userId={user?.id || 'current'} />
              ) : (
                <div className="flex items-center justify-center p-6 text-red-400">
                  <p>Error: User not logged in. Please log in to view your hydration timeline.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Timeline events */}
          <div className="space-y-4 relative pl-8">
            {events.map((event) => (
              <motion.div
                key={event.id}
                className="relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="absolute -left-8 mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center"
                  style={{
                    backgroundColor: getEventColor(event.type),
                    borderColor: getEventColor(event.type),
                    boxShadow: `0 0 10px ${getEventColor(event.type)}60`,
                  }}
                >
                  {getEventIcon(event.type)}
                </div>
                <div className="mb-1 text-xs opacity-70">{event.time}</div>
                <Card className="p-3 bg-slate-700/50 border-slate-600">
                  <div
                    className="text-sm font-medium"
                    style={{ color: getEventColor(event.type) }}
                  >
                    {event.type === "water"
                      ? `${event.amount}ml Water`
                      : event.type === "protein"
                      ? `${event.amount}g Protein`
                      : event.type === "electrolyte"
                      ? `Electrolyte Drink`
                      : event.type === "workout"
                      ? `Workout`
                      : `Food`}
                  </div>
                  {event.description && (
                    <div className="text-xs opacity-70 mt-1">{event.description}</div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full">
          {/* Hydration Gap Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-slate-800/50 border-cyan-400/30 shadow-lg shadow-cyan-900/10">
              <CardHeader className="pb-2">
                <CardTitle
                  className="text-lg font-medium"
                  style={{ color: "#00FFFF", textShadow: "0 0 8px #00FFFF40" }}
                >
                  Daily Hydration Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Water intake today</span>
                      <span>Target</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>{waterIntake}ml</span>
                      <span className="text-cyan-400">{waterRemaining}ml</span>
                    </div>
                    <Progress 
                      value={waterIntake > 0 && waterRemaining > 0 ? (waterIntake / waterRemaining) * 100 : 0} 
                      className="h-2 mt-1 bg-slate-800"
                    />
                    <div className="text-xs text-muted-foreground mt-2">
                      Based on your {userProfile.weight}kg {userProfile.bodyType} build
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-cyan-400/30 shadow-lg shadow-cyan-900/10">
              <CardHeader className="pb-2">
                <CardTitle
                  className="text-lg font-medium"
                  style={{ color: "#00FFFF", textShadow: "0 0 8px #00FFFF40" }}
                >
                  Hydration Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm mb-1">Water</div>
                  <div className="font-bold">{waterRemaining}ml</div>
                  <Progress value={75} className="h-2 mt-1 bg-slate-800" />
                </div>
                <div>
                  <div className="text-sm mb-1">Protein</div>
                  <div className="font-bold">{proteinIntake}g</div>
                  <Progress value={60} className="h-2 mt-1 bg-slate-800" />
                </div>
                <div>
                  <div className="text-sm mb-1">Sodium</div>
                  <div className="font-bold">{sodiumIntake}mg</div>
                  <Progress value={40} className="h-2 mt-1 bg-slate-800" />
                </div>
                <div>
                  <div className="text-sm mb-1">Potassium</div>
                  <div className="font-bold">{potassiumIntake}mg</div>
                  <Progress value={30} className="h-2 mt-1 bg-slate-800" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="bg-slate-800/50 border-blue-400/30 shadow-lg shadow-blue-900/10 mb-6">
            <CardHeader className="pb-2">
              <CardTitle
                className="text-lg font-medium"
                style={{ color: "#9D8DF1", textShadow: "0 0 8px rgba(157, 141, 241, 0.4)" }}
              >
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : userProfile && userProfile.weight > 0 ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium" style={{ color: "#00FFFF" }}>
                      Personalized Recommendations
                    </h3>
                    <div className="text-sm text-slate-400">
                      Based on your {userProfile.weight}kg {userProfile.bodyType} build
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="border-blue-400/30 justify-start"
                      onClick={() => {
                        setNewEvent({
                          ...newEvent,
                          type: "water",
                          amount: 500,
                          description: "Water"
                        });
                        setShowAddModal(true);
                      }}
                    >
                      <Droplets className="h-4 w-4 mr-2 text-cyan-400" />
                      Add 500ml Water
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="border-blue-400/30 justify-start"
                      onClick={() => {
                        setNewEvent({
                          ...newEvent,
                          type: "electrolyte",
                          amount: 330,
                          description: "Electrolyte Drink"
                        });
                        setShowAddModal(true);
                      }}
                    >
                      <Dumbbell className="h-4 w-4 mr-2 text-purple-400" />
                      Add Electrolyte Drink
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 text-slate-400">
                  No recommendations at this time.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="bg-slate-800 border-cyan-400/30 sm:max-w-[500px] w-[95vw]">
          <DialogHeader>
            <DialogTitle style={{ color: "#00FFFF" }}>Update Profile</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="space-y-2">
              <Label className="text-cyan-400">Biological Sex</Label>
              <Tabs
                value={userProfile.sex}
                onValueChange={(value) =>
                  setUserProfile({ ...userProfile, sex: value as 'male' | 'female' })
                }
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full bg-slate-700">
                  <TabsTrigger
                    value="male"
                    className="data-[state=active]:bg-blue-400/20 data-[state=active]:text-blue-300"
                  >
                    Male
                  </TabsTrigger>
                  <TabsTrigger
                    value="female"
                    className="data-[state=active]:bg-pink-400/20 data-[state=active]:text-pink-300"
                  >
                    Female
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-400">Body Type</Label>
              {userProfile.sex === 'male' ? (
                <Tabs
                  value={userProfile.bodyType}
                  onValueChange={(value) =>
                    setUserProfile({ ...userProfile, bodyType: value as BodyType })
                  }
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 w-full bg-slate-700 h-auto p-1 gap-1">
                    <TabsTrigger
                      value="muscular"
                      className="data-[state=active]:bg-green-400/20 data-[state=active]:text-green-300 py-2"
                    >
                      Muscular
                    </TabsTrigger>
                    <TabsTrigger
                      value="athletic"
                      className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300 py-2"
                    >
                      Athletic
                    </TabsTrigger>
                    <TabsTrigger
                      value="stocky"
                      className="data-[state=active]:bg-pink-400/20 data-[state=active]:text-pink-300 py-2"
                    >
                      Stocky
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              ) : (
                <Tabs
                  value={userProfile.bodyType}
                  onValueChange={(value) =>
                    setUserProfile({ ...userProfile, bodyType: value as BodyType })
                  }
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 w-full bg-slate-700 h-auto p-1 gap-1">
                    <TabsTrigger
                      value="toned"
                      className="data-[state=active]:bg-green-400/20 data-[state=active]:text-green-300 py-2"
                    >
                      Toned
                    </TabsTrigger>
                    <TabsTrigger
                      value="athletic_female"
                      className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300 py-2"
                    >
                      Athletic
                    </TabsTrigger>
                    <TabsTrigger
                      value="curvy"
                      className="data-[state=active]:bg-pink-400/20 data-[state=active]:text-pink-300 py-2"
                    >
                      Curvy
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight" className="text-cyan-400">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                className="bg-slate-700/70 border-slate-600 text-slate-100"
                value={userProfile.weight}
                onChange={(e) => setUserProfile({ ...userProfile, weight: Number(e.target.value) })}
              />
            </div>
          </div>
          <Button
            onClick={updateProfile}
            className="bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30"
            style={{ color: "#00FFFF" }}
          >
            Save Profile
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
