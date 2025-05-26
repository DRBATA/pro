"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Droplets, Dumbbell, Clock, Target, User, ShoppingBag, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BODY_FAT_PERCENTAGES } from "@/lib/hydration-engine"

// Body type display mapping
const BODY_TYPES = {
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

// Safe function to get body type name
function getBodyTypeName(bodyType: string | undefined): string {
  if (!bodyType || !BODY_TYPES[bodyType]) return BODY_TYPES.default.name;
  return BODY_TYPES[bodyType].name;
}
import { KitType, kitDescriptions, kitRituals } from "@/lib/hydration-engine"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { RadialProgress } from "@/components/radial-progress"
import { GlowCard } from "@/components/glow-card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  getUserProfile, 
  getTodayHydrationEvents, 
  getDailyTarget, 
  logHydrationEvent,
  createOrder,
  getUserHydrationGap
} from "@/lib/client-functions"
import { HydrationEvent as DBHydrationEvent, Order as DBOrder } from "@/lib/types/database.types"

// Frontend Event types (for UI state management)
export type HydrationEvent = {
  id: string
  time: string
  type: "water" | "protein" | "electrolyte" | "workout" | "food"
  amount?: number
  preWeight?: number
  postWeight?: number
  description: string
}

// Frontend Order type (for UI state management)
export type Order = {
  id: string
  kitName: string
  status: "pending" | "in-progress" | "completed"
  timestamp: string
  location?: string
}

// Helper functions for dashboard

// Convert database hydration event to frontend format
function convertDBEventToUI(dbEvent: DBHydrationEvent): HydrationEvent {
  return {
    id: dbEvent.id,
    time: dbEvent.event_time,
    type: dbEvent.event_type as "water" | "protein" | "electrolyte" | "workout" | "food",
    amount: dbEvent.amount || dbEvent.amount_ml || dbEvent.amount_g,
    preWeight: dbEvent.pre_weight,
    postWeight: dbEvent.post_weight,
    description: dbEvent.description || ""
  }
}

// Get color for event type
function getEventColor(type: string): string {
  switch (type) {
    case "water":
      return "#00FFFF" // Cyan
    case "protein":
      return "#FF6B9D" // Pink
    case "electrolyte":
      return "#9D8DF1" // Purple
    case "workout":
      return "#FFD166" // Yellow
    case "food":
      return "#06D6A0" // Green
    default:
      return "#FFFFFF" // White
  }
}

// Get icon for event type
function getEventIcon(type: string) {
  switch (type) {
    case "water":
      return <Droplets className="h-4 w-4" />
    case "protein":
      return <Target className="h-4 w-4" />
    case "electrolyte":
      return <Dumbbell className="h-4 w-4" />
    case "workout":
      return <Clock className="h-4 w-4" />
    case "food":
      return <Target className="h-4 w-4" />
    default:
      return <Plus className="h-4 w-4" />
  }
}

// Add event handler
function addEvent(newEvent: any) {
  // Implementation would go here
  console.log('Add event:', newEvent);
}

// Calculate hydration percentage
function hydrationPercentage(current: number, target: number): number {
  return Math.min(Math.round((current / target) * 100), 100);
}

// Update profile handler
async function updateProfile() {
  if (!userId) return;
  
  try {
    // Show loading toast
    toast({
      title: "Updating profile",
      description: "Saving your profile information..."
    });
    
    // Save profile to Supabase
    const updatedProfile = await updateUserProfile(userId, {
      weight: userProfile.weight,
      sex: userProfile.sex,
      body_type: userProfile.bodyType
    });
    
    if (updatedProfile) {
      // Close modal and show success toast
      setShowProfileModal(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
        variant: "default"
      });
      
      // Refresh hydration calculations with new profile data
      const hydrationData = await getUserHydrationGap(userId);
      if (hydrationData) {
        setHydrationGapData({
          hydrationGap: hydrationData.hydrationGap,
          context: hydrationData.context,
          leanBodyMass: hydrationData.leanBodyMass,
          waterLoss: hydrationData.waterLoss,
          waterFromFood: hydrationData.waterFromFood,
          totalWaterInput: hydrationData.totalWaterInput,
          recommendedIntake: hydrationData.recommendedIntake
        });
        
        // Update daily targets based on new profile
        setDailyTarget({
          water_ml: Math.round(hydrationData.recommendedIntake),
          protein_g: Math.round(hydrationData.leanBodyMass * 1.2), // 1.2g per kg LBM
          sodium_mg: Math.round(hydrationData.leanBodyMass * 25),  // 25mg per kg LBM
          potassium_mg: Math.round(hydrationData.leanBodyMass * 80) // 80mg per kg LBM
        });
      }
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    toast({
      title: "Update failed",
      description: "There was a problem updating your profile. Please try again.",
      variant: "destructive"
    });
  }
}

// Complete sweat test handler
function completeSweatTest() {
  // Implementation would go here
  console.log('Complete sweat test');
}

// Purchase kit handler
function purchaseKit() {
  // Implementation would go here
  console.log('Purchase kit');
}

// Calculate daily needs based on weight, sex, and body type
function calculateDailyNeeds(weight: number, sex: 'male' | 'female', bodyType: string) {
  // Map legacy body types if needed
  let mappedBodyType = bodyType;
  if (bodyType === 'low' || bodyType === 'average' || bodyType === 'high') {
    // Map legacy types to new types
    if (sex === 'male') {
      mappedBodyType = bodyType === 'low' ? 'muscular' : 
                       bodyType === 'average' ? 'athletic' : 'stocky';
    } else {
      mappedBodyType = bodyType === 'low' ? 'toned' : 
                       bodyType === 'average' ? 'athletic_female' : 'curvy';
    }
  }
  
  // Get body fat percentage based on sex and body type
  const fatPercentage = BODY_FAT_PERCENTAGES[sex][mappedBodyType] || 
                        (sex === 'male' ? BODY_FAT_PERCENTAGES[sex]['athletic'] : BODY_FAT_PERCENTAGES[sex]['athletic_female']);
  
  // Calculate lean body mass
  const leanBodyMass = weight * (1 - fatPercentage);
  
  return {
    water: Math.round(leanBodyMass * 30), // 30ml per kg of lean mass
    protein: Math.round(leanBodyMass * 1.2), // 1.2g per kg of lean mass
    sodium: Math.round(leanBodyMass * 25), // 25mg per kg of lean mass
    potassium: Math.round(leanBodyMass * 80), // 80mg per kg of lean mass
  }
}

export default function UserDashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [userId, setUserId] = useState<string | null>("testuser") // For dev
  const [userProfile, setUserProfile] = useState({
    weight: 70,
    sex: 'male' as 'male' | 'female',
    bodyType: 'average' as 'low' | 'average' | 'high',
  })
  const [events, setEvents] = useState<HydrationEvent[]>([])
  const [dailyTarget, setDailyTarget] = useState({
    water_ml: 2500,
    protein_g: 70,
    sodium_mg: 2000,
    potassium_mg: 3500,
  })
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showSweatTestModal, setShowSweatTestModal] = useState(false)
  const [newEvent, setNewEvent] = useState<Partial<HydrationEvent>>({
    time: new Date().toTimeString().slice(0, 5),
    type: "water",
  })
  const [recommendation, setRecommendation] = useState<{ text: string; kit: string } | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [location, setLocation] = useState("")
  const [kitToPurchase, setKitToPurchase] = useState("")
  const [sweatTest, setSweatTest] = useState({
    preWeight: 75.0,
    postWeight: 74.5,
    duration: 15,
  })
  const { toast } = useToast()

  // Load user data
  useEffect(() => {
    // For demo purposes, we'll use a hardcoded user ID
    // In a real app, you'd get this from an auth context
    const tempUserId = "1234-5678-9101"; // This will be replaced with real auth
    setUserId(tempUserId);
    
    async function loadUserData() {
      if (!tempUserId) return;
      
      setIsLoading(true);
      try {
        // Calculate hydration gap using the new function
        const hydrationData = await getUserHydrationGap(tempUserId);
        
        if (hydrationData) {
          // Set user profile
          if (hydrationData.user) {
            setUserProfile({
              weight: hydrationData.user.weight,
              sex: hydrationData.user.sex as 'male' | 'female',
              bodyType: hydrationData.user.body_type as 'low' | 'average' | 'high',
            });
          }
          
          // Set events
          if (hydrationData.events.length > 0) {
            setEvents(hydrationData.events.map(convertDBEventToUI));
          }
          
          // Set hydration gap data
          setHydrationGapData({
            hydrationGap: hydrationData.hydrationGap,
            context: hydrationData.context,
            leanBodyMass: hydrationData.leanBodyMass,
            waterLoss: hydrationData.waterLoss,
            waterFromFood: hydrationData.waterFromFood,
            totalWaterInput: hydrationData.totalWaterInput,
            recommendedIntake: hydrationData.recommendedIntake
          });
          
          // Set daily target based on the calculated recommended intake
          setDailyTarget({
            water_ml: Math.round(hydrationData.recommendedIntake),
            protein_g: Math.round(hydrationData.leanBodyMass * 1.2), // 1.2g per kg LBM
            sodium_mg: Math.round(hydrationData.leanBodyMass * 25),  // 25mg per kg LBM
            potassium_mg: Math.round(hydrationData.leanBodyMass * 80) // 80mg per kg LBM
          });
          
          // Generate recommendation based on hydration gap
          if (!recommendation) {
            let recommendedKit = "Sky Salt"; // Default
            let recommendationText = "";
            
            if (hydrationData.hydrationGap > 500) {
              recommendedKit = "White Ember";
              recommendationText = `You're currently at a ${Math.round(hydrationData.hydrationGap)}ml hydration deficit. We recommend the White Ember kit to replenish quickly.`;
            } else if (hydrationData.context === 'active') {
              recommendedKit = "Silver Mirage";
              recommendationText = `Based on your activity level, we recommend the Silver Mirage kit to maintain optimal hydration.`;
            } else if (hydrationData.context === 'fasting') {
              recommendedKit = "Echo Spiral";
              recommendationText = `While fasting, we recommend the Echo Spiral kit to maintain electrolyte balance.`;
            } else {
              recommendationText = `For your current hydration needs, we recommend the ${recommendedKit} kit.`;
            }
            
            setRecommendation({
              text: recommendationText,
              kit: recommendedKit as KitType
            });
          }
        } else {
          // Fallback to individual API calls if the hydration gap calculation fails
          const profile = await getUserProfile(tempUserId);
          if (profile) {
            setUserProfile({
              weight: profile.weight,
              sex: profile.sex as 'male' | 'female',
              bodyType: profile.body_type as 'low' | 'average' | 'high',
            });
          }
          
          const dbEvents = await getTodayHydrationEvents(tempUserId);
          if (dbEvents && dbEvents.length > 0) {
            setEvents(dbEvents.map(convertDBEventToUI));
          }
          
          const target = await getDailyTarget(tempUserId);
          if (target) {
            setDailyTarget({
              water_ml: target.water_ml,
              protein_g: target.protein_g,
              sodium_mg: target.sodium_mg,
              potassium_mg: target.potassium_mg,
            });
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast({
          title: "Error loading data",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserData();
  }, [toast, recommendation]);

  useEffect(() => {
    // Generate recommendations based on hydration events
    if (!recommendation && events.length > 0) {
      const workoutEvents = events.filter((e) => e.type === "workout" && e.preWeight && e.postWeight)
      if (workoutEvents.length > 0) {
        const latestWorkout = workoutEvents[workoutEvents.length - 1]
        const sweatLoss = (latestWorkout.preWeight! - latestWorkout.postWeight!) * 1000
        setRecommendation({
          text: `Based on your workout, you lost ${Math.round(sweatLoss)}ml in sweat. We recommend the White Ember kit with electrolytes to restore balance.`,
          kit: "White Ember",
        })
      } else {
        setRecommendation({
          text: `Based on your timeline, we recommend the Silver Mirage kit to optimize your hydration throughout the day.`,
          kit: "Silver Mirage",
        })
      }
    }
  }, [events, recommendation])

  // Calculate current status
  const dailyNeeds = calculateDailyNeeds(userProfile.weight, userProfile.sex, userProfile.bodyType)
  const currentIntake = {
    water: events
      .filter((e) => e.type === "water" || e.type === "electrolyte")
      .reduce((sum, e) => sum + (e.amount || 0), 0),
    protein: events.filter((e) => e.type === "protein").reduce((sum, e) => sum + (e.amount || 0), 0),
    sweatLoss: events
      .filter((e) => e.type === "workout" && e.preWeight && e.postWeight)
      .reduce((sum, e) => sum + (e.preWeight! - e.postWeight!) * 1000, 0), // Convert kg to ml
  }

  // Neon triangle animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 100
    canvas.height = 100

    let hue = 180
    let time = 0

    const drawNeonEffects = () => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const size = 40

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw main triangle
      ctx.beginPath()
      ctx.moveTo(centerX, centerY - size)
      ctx.lineTo(centerX - size * 0.866, centerY + size / 2)
      ctx.lineTo(centerX + size * 0.866, centerY + size / 2)
      ctx.closePath()

      const gradient = ctx.createLinearGradient(centerX - size, centerY - size, centerX + size, centerY + size)
      gradient.addColorStop(0, `hsla(${hue}, 100%, 80%, 0.9)`)
      gradient.addColorStop(1, `hsla(${hue + 120}, 100%, 80%, 0.9)`)

      ctx.strokeStyle = gradient
      ctx.lineWidth = 2
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.8)`
      ctx.shadowBlur = 20
      ctx.stroke()

      // Draw floating particles
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time
        const distance = 50 + Math.sin(time * 2 + i) * 10
        const x = centerX + Math.cos(angle) * distance
        const y = centerY + Math.sin(angle) * distance

        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${(hue + i * 10) % 360}, 100%, 80%, ${0.4 + Math.sin(time + i) * 0.2})`
        ctx.shadowColor = `hsla(${(hue + i * 10) % 360}, 100%, 70%, 0.8)`
        ctx.shadowBlur = 10
        ctx.fill()
      }

      hue = (hue + 0.5) % 360
      time += 0.02
      requestAnimationFrame(drawNeonEffects)
    }

    drawNeonEffects()
  }, [])

  async function handleAddEvent() {
    if (!newEvent.type || !newEvent.time || !userId) return

    try {
      // Prepare the event for the database
      const dbEvent: Omit<DBHydrationEvent, 'id' | 'created_at'> = {
        user_id: userId,
        event_date: new Date().toISOString().split('T')[0],
        event_time: newEvent.time,
        event_type: newEvent.type as "water" | "protein" | "electrolyte" | "workout",
        description: newEvent.description || "",
      }

      if (newEvent.type === "workout") {
        dbEvent.pre_weight = sweatTest.preWeight
        dbEvent.post_weight = sweatTest.postWeight
      } else if (newEvent.amount) {
        if (newEvent.type === "protein") {
          dbEvent.amount_g = newEvent.amount
        } else {
          dbEvent.amount_ml = newEvent.amount
        }
      }

      // Save to database
      const savedEvent = await logHydrationEvent(dbEvent)
      
      if (savedEvent) {
        // Add to local state
        const uiEvent = convertDBEventToUI(savedEvent)
        setEvents([...events, uiEvent])
        
        toast({
          title: "Event added",
          description: `${newEvent.type} event added to your timeline`,
        })
      }

      // Reset form
      setNewEvent({
        time: new Date().toTimeString().slice(0, 5),
        type: "water",
      })
      setShowAddModal(false)
      setShowSweatTestModal(false)
    } catch (error) {
      console.error("Error adding hydration event:", error)
      toast({
        title: "Error adding event",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }
  
  async function handlePurchaseKit() {
    if (!kitToPurchase || !userId) return

    try {
      // Prepare the order for the database
      const dbOrder: Omit<DBOrder, 'id' | 'ordered_at' | 'completed_at'> = {
        user_id: userId,
        kit_id: kitToPurchase, // Normally this would be the actual kit ID, not the name
        status: "pending",
        location: location || undefined,
        payment_status: "pending", // Assuming this field exists in your schema
        delivery_method: location ? "venue" : "delivery" // Tracking delivery method
      }

      // Save to database
      const savedOrder = await createOrder(dbOrder)
      
      if (savedOrder) {
        // Add to local state for UI display
        const uiOrder: Order = {
          id: savedOrder.id,
          kitName: kitToPurchase, // Using the name for display
          status: "pending",
          timestamp: new Date().toISOString(),
          location: location || undefined,
        }
        
        setOrders([...orders, uiOrder])
        
        toast({
          title: "Order placed",
          description: `Your ${kitToPurchase} kit has been ordered`,
        })
      }

      // Reset form
      setKitToPurchase("")
      setLocation("")
      setShowLocationModal(false)
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Error placing order",
        description: "Please try again",
        variant: "destructive",
      })
    }
    
    // Generate a new recommendation after purchase
    const archetypes = ["post_sweat_cool", "mental_fog", "gut_rebalance", "rest_reset", "clean_energy", "detox_gentle"]
    const randomArchetype = archetypes[Math.floor(Math.random() * archetypes.length)]

    const kitOptions = {
      post_sweat_cool: "Copper Whisper",
      mental_fog: "Cold Halo",
      gut_rebalance: "Echo Spiral",
      rest_reset: "Night Signal",
      clean_energy: "Morning Flow",
      detox_gentle: "Ghost Bloom",
    }

    const newKit = kitOptions[randomArchetype as keyof typeof kitOptions]

    setRecommendation({
      text: `Based on your recent activity pattern, we also recommend trying the ${newKit} kit to complement your hydration routine.`,
      kit: newKit,
    })
  }

  const initiateKitPurchase = (kit: string) => {
    setKitToPurchase(kit)
    setShowLocationModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Toaster />

      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-cyan-400/20">
        <div className="flex items-center gap-4">
          <canvas ref={canvasRef} className="w-[60px] h-[60px]" />
          <h1
            className="text-2xl font-light tracking-wider"
            style={{
              color: "#00FFFF",
              textShadow: "0 0 15px #00FFFF",
            }}
          >
            WATER BAR
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm opacity-70 flex items-center gap-2">
            <span>
              {userProfile.weight}kg • {getBodyTypeName(userProfile.bodyType)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setShowProfileModal(true)}
            >
              <Settings className="h-4 w-4" style={{ color: "#00FFFF" }} />
            </Button>
          </div>
          <Button
            className="bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30"
            style={{ color: "#00FFFF" }}
            onClick={() => (window.location.href = "/")}
          >
            <User className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sticky Timeline Sidebar */}
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
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-pink-400/20 border border-pink-400/60 hover:bg-pink-400/30"
                style={{ color: "#FF6B9D" }}
                onClick={() => setShowSweatTestModal(true)}
              >
                <Dumbbell className="h-4 w-4 mr-1" /> Test
              </Button>
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
                        onValueChange={(value) => setNewEvent({ ...newEvent, type: value as any })}
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
                    {newEvent.type === "workout" && (
                      <>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right text-cyan-400">Pre-weight</Label>
                          <Input
                            type="number"
                            step="0.1"
                            className="col-span-3 bg-slate-700 border-cyan-400/30"
                            placeholder="kg"
                            value={newEvent.preWeight || ""}
                            onChange={(e) => setNewEvent({ ...newEvent, preWeight: Number(e.target.value) })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right text-cyan-400">Post-weight</Label>
                          <Input
                            type="number"
                            step="0.1"
                            className="col-span-3 bg-slate-700 border-cyan-400/30"
                            placeholder="kg"
                            value={newEvent.postWeight || ""}
                            onChange={(e) => setNewEvent({ ...newEvent, postWeight: Number(e.target.value) })}
                          />
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right text-cyan-400">Description</Label>
                      <Input
                        className="col-span-3 bg-slate-700 border-cyan-400/30"
                        value={newEvent.description || ""}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={addEvent}
                    className="bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30"
                    style={{ color: "#00FFFF" }}
                  >
                    Add Event
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative pl-6 border-l-2 border-cyan-400/30 space-y-4">
            {events.map((event) => (
              <motion.div
                key={event.id}
                className="relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
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
                <Card className="p-3 bg-slate-700/50 border-cyan-400/20">
                  <div className="text-sm font-medium" style={{ color: getEventColor(event.type) }}>
                    {event.description}
                  </div>
                  {event.amount && (
                    <div className="text-xs opacity-70 mt-1">
                      {event.amount}
                      {event.type === "protein" ? "g" : "ml"}
                    </div>
                  )}
                  {event.preWeight && event.postWeight && (
                    <div className="text-xs opacity-70 mt-1">
                      Sweat loss: {Math.round((event.preWeight - event.postWeight) * 1000)}ml
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}

            {/* Orders in timeline */}
            {orders.map((order) => (
              <motion.div
                key={order.id}
                className="relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div
                  className="absolute -left-8 mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center"
                  style={{
                    backgroundColor: "#B388FF",
                    borderColor: "#B388FF",
                    boxShadow: "0 0 10px #B388FF60",
                  }}
                >
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div className="mb-1 text-xs opacity-70">
                  {new Date(order.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <Card className="p-3 bg-slate-700/50 border-purple-400/20">
                  <div className="text-sm font-medium" style={{ color: "#B388FF" }}>
                    {order.kitName} Kit Ordered
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    Status:{" "}
                    {order.status === "pending"
                      ? "Preparing"
                      : order.status === "in-progress"
                        ? "On the way"
                        : "Delivered"}
                  </div>
                  <div className="text-xs opacity-70">Location: {order.location}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Precision Hydration Info */}
          <div className="mb-4 bg-slate-800/70 border border-cyan-400/20 rounded-md p-3 flex items-center">
            <div className="text-xs text-slate-300">
              <span className="text-cyan-400 font-medium">Precision Hydration:</span> Your targets are calculated using your lean body mass (based on your sex and body type) rather than total weight, for scientifically accurate recommendations.
            </div>
          </div>
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-slate-700/50 border-cyan-400/20">
              <div className="text-center">
                <div
                  className="text-4xl font-light mb-2"
                  style={{
                    color: "#00FFFF",
                    textShadow: "0 0 20px #00FFFF60",
                  }}
                >
                  {hydrationPercentage}%
                </div>
                <div className="text-sm opacity-70">Hydration Level</div>
                <div className="text-xs mt-2">
                  {currentIntake.water - currentIntake.sweatLoss}ml / {dailyNeeds.water}ml
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-slate-700/50 border-green-400/20">
              <div className="text-center">
                <div
                  className="text-4xl font-light mb-2"
                  style={{
                    color: "#00FF88",
                    textShadow: "0 0 20px #00FF8860",
                  }}
                >
                  {Math.round((currentIntake.protein / dailyNeeds.protein) * 100)}%
                </div>
                <div className="text-sm opacity-70">Protein Intake</div>
                <div className="text-xs mt-2">
                  {currentIntake.protein}g / {dailyNeeds.protein}g
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-slate-700/50 border-pink-400/20">
              <div className="text-center">
                <div
                  className="text-4xl font-light mb-2"
                  style={{
                    color: "#FF6B9D",
                    textShadow: "0 0 20px #FF6B9D60",
                  }}
                >
                  {currentIntake.sweatLoss}ml
                </div>
                <div className="text-sm opacity-70">Sweat Loss</div>
                <div className="text-xs mt-2">From workouts today</div>
              </div>
            </Card>
          </div>

          {/* Recommendation */}
          <AnimatePresence>
            {recommendation && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-6 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 border-cyan-400/30">
                  <h3
                    className="text-lg font-medium mb-2"
                    style={{
                      color: "#00FFFF",
                      textShadow: "0 0 10px #00FFFF60",
                    }}
                  >
                    Recommendation
                  </h3>
                  <p className="text-sm opacity-90">{recommendation.text}</p>
                  <div className="flex gap-3 mt-4">
                    <Button
                      className="bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30"
                      style={{ color: "#00FFFF" }}
                      onClick={() => initiateKitPurchase(recommendation.kit)}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" /> Order {recommendation.kit} Kit
                    </Button>
                    <Button
                      variant="outline"
                      className="border-cyan-400/30 hover:bg-cyan-400/10"
                      onClick={() => setRecommendation(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Daily Targets */}
          <Card className="p-6 bg-slate-700/50 border-cyan-400/20">
            <h3
              className="text-lg font-medium mb-4"
              style={{
                color: "#00FFFF",
                textShadow: "0 0 10px #00FFFF60",
              }}
            >
              Daily Targets ({BODY_TYPES[userProfile.bodyType].name} - {userProfile.weight}kg)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-light" style={{ color: "#00FFFF" }}>
                  {dailyNeeds.water}ml
                </div>
                <div className="text-xs opacity-70">Water</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light" style={{ color: "#00FF88" }}>
                  {dailyNeeds.protein}g
                </div>
                <div className="text-xs opacity-70">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light" style={{ color: "#4FC3F7" }}>
                  {dailyNeeds.sodium}mg
                </div>
                <div className="text-xs opacity-70">Sodium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light" style={{ color: "#B388FF" }}>
                  {dailyNeeds.potassium}mg
                </div>
                <div className="text-xs opacity-70">Potassium</div>
              </div>
            </div>
          </Card>

          {/* Active Orders */}
          {orders.length > 0 && (
            <Card className="p-6 bg-slate-700/50 border-purple-400/20 mt-8">
              <h3
                className="text-lg font-medium mb-4"
                style={{
                  color: "#B388FF",
                  textShadow: "0 0 10px #B388FF60",
                }}
              >
                Your Active Orders
              </h3>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-purple-400/20"
                  >
                    <div>
                      <div className="font-medium" style={{ color: "#B388FF" }}>
                        {order.kitName} Kit
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        Ordered at {new Date(order.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs px-2 py-1 rounded-full bg-purple-400/20 text-purple-300">
                        {order.status === "pending"
                          ? "Preparing"
                          : order.status === "in-progress"
                            ? "On the way"
                            : "Delivered"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="bg-slate-800 border-cyan-400/30">
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
              <Label className="text-cyan-400">Weight (kg)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[userProfile.weight]}
                  min={40}
                  max={120}
                  step={0.1}
                  onValueChange={(value) => setUserProfile({ ...userProfile, weight: value[0] })}
                  className="flex-1"
                />
                <span className="w-12 text-right">{userProfile.weight}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-400">Body Type</Label>
              {userProfile.sex === 'male' ? (
                <Tabs
                  value={userProfile.bodyType}
                  onValueChange={(value) =>
                    setUserProfile({ ...userProfile, bodyType: value as keyof typeof BODY_TYPES })
                  }
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 w-full bg-slate-700">
                    <TabsTrigger
                      value="muscular"
                      className="data-[state=active]:bg-green-400/20 data-[state=active]:text-green-300"
                    >
                      Muscular
                    </TabsTrigger>
                    <TabsTrigger
                      value="athletic"
                      className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300"
                    >
                      Athletic
                    </TabsTrigger>
                    <TabsTrigger
                      value="stocky"
                      className="data-[state=active]:bg-pink-400/20 data-[state=active]:text-pink-300"
                    >
                      Stocky
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              ) : (
                <Tabs
                  value={userProfile.bodyType}
                  onValueChange={(value) =>
                    setUserProfile({ ...userProfile, bodyType: value as keyof typeof BODY_TYPES })
                  }
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 w-full bg-slate-700">
                    <TabsTrigger
                      value="toned"
                      className="data-[state=active]:bg-green-400/20 data-[state=active]:text-green-300"
                    >
                      Toned
                    </TabsTrigger>
                    <TabsTrigger
                      value="athletic_female"
                      className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300"
                    >
                      Athletic
                    </TabsTrigger>
                    <TabsTrigger
                      value="curvy"
                      className="data-[state=active]:bg-pink-400/20 data-[state=active]:text-pink-300"
                    >
                      Curvy
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
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

      {/* Sweat Test Modal */}
      <Dialog open={showSweatTestModal} onOpenChange={setShowSweatTestModal}>
        <DialogContent className="bg-slate-800 border-pink-400/30">
          <DialogHeader>
            <DialogTitle style={{ color: "#FF6B9D", textShadow: "0 0 10px rgba(255, 107, 157, 0.5)" }} className="text-xl font-bold">Sweat Rate Test</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="bg-slate-700/70 border border-pink-400/30 rounded-md p-3 mb-3 shadow-inner shadow-pink-400/10">
              <p className="text-sm text-slate-100 mb-2">
                <span className="text-pink-400 font-bold" style={{ textShadow: "0 0 8px rgba(255, 107, 157, 0.4)" }}>For accurate results:</span>
              </p>
              <ul className="text-xs text-slate-200 list-disc pl-4 space-y-1">
                <li>Do at least 20 minutes of activity</li>
                <li>Weigh yourself in dry clothes before and after</li>
                <li>Don't drink or use the restroom between measurements</li>
                <li>Dry off completely after activity before weighing</li>
              </ul>
            </div>
            <p className="text-sm">
              Record your weight before and after your workout to calculate your personal sweat rate.
            </p>

            <div className="space-y-2">
              <Label className="text-pink-400">Pre-Workout Weight (kg)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[sweatTest.preWeight]}
                  min={40}
                  max={120}
                  step={0.1}
                  onValueChange={(value) => setSweatTest({ ...sweatTest, preWeight: value[0] })}
                  className="flex-1"
                />
                <span className="w-12 text-right">{sweatTest.preWeight}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-pink-400">Post-Workout Weight (kg)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[sweatTest.postWeight]}
                  min={40}
                  max={120}
                  step={0.1}
                  onValueChange={(value) => setSweatTest({ ...sweatTest, postWeight: value[0] })}
                  className="flex-1"
                />
                <span className="w-12 text-right">{sweatTest.postWeight}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-pink-400">Duration (minutes)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[sweatTest.duration]}
                  min={5}
                  max={60}
                  step={1}
                  onValueChange={(value) => setSweatTest({ ...sweatTest, duration: value[0] })}
                  className="flex-1"
                />
                <span className="w-12 text-right">{sweatTest.duration}</span>
              </div>
            </div>

            <div className="p-4 bg-pink-400/15 rounded-md border border-pink-400/40 shadow-lg shadow-pink-400/5">
              <p className="text-sm mb-1">
                Calculated sweat loss:{" "}
                <strong className="text-pink-400" style={{ textShadow: "0 0 8px rgba(255, 107, 157, 0.4)" }}>
                  {Math.round((sweatTest.preWeight - sweatTest.postWeight) * 1000)}ml
                </strong>
              </p>
              <p className="text-sm">
                Sweat rate:{" "}
                <strong className="text-pink-400" style={{ textShadow: "0 0 8px rgba(255, 107, 157, 0.4)" }}>
                  {Math.round(((sweatTest.preWeight - sweatTest.postWeight) * 1000) / sweatTest.duration)}ml/min
                </strong>
              </p>
            </div>
            
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-400">Want more precise measurements?</p>
              
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-pink-400/30 text-xs justify-start"
                  onClick={() => toast({
                    title: "Feature requested",
                    description: "We've noted your interest in activity intensity tracking.",
                    variant: "default"
                  })}
                >
                  <Plus className="h-3 w-3 mr-2" /> Request activity intensity tracking
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-pink-400/30 text-xs justify-start"
                  onClick={() => toast({
                    title: "Feature requested",
                    description: "We've noted your interest in sweat composition analysis.",
                    variant: "default"
                  })}
                >
                  <Plus className="h-3 w-3 mr-2" /> Request salt/sweat strip support
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-pink-400/30 text-xs justify-start"
                  onClick={() => toast({
                    title: "Feature requested",
                    description: "We've noted your interest in advanced body composition analysis.",
                    variant: "default"
                  })}
                >
                  <Plus className="h-3 w-3 mr-2" /> Request body composition analyzer support
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={completeSweatTest}
              className="bg-pink-400/30 border border-pink-400/70 hover:bg-pink-400/40 flex-1 shadow-md shadow-pink-400/20 transition-all duration-300"
              style={{ color: "#FF6B9D", textShadow: "0 0 8px rgba(255, 107, 157, 0.3)" }}
            >
              Log Sweat Test
            </Button>
            <Button
              onClick={() => setShowSweatTestModal(false)}
              variant="outline"
              className="border-slate-600 hover:bg-slate-700/50"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="bg-slate-800 border-cyan-400/30">
          <DialogHeader>
            <DialogTitle style={{ color: "#00FFFF" }}>Where are you?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm mb-4">
              Please let us know your current location so we can deliver your {kitToPurchase} kit to you.
            </p>
            <Input
              className="bg-slate-700 border-cyan-400/30"
              placeholder="e.g., Conference Room B, Table 12, Poolside..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <Button
            onClick={purchaseKit}
            className="bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30"
            style={{ color: "#00FFFF" }}
          >
            Confirm Order
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
