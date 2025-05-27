"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Plus, Droplets, Dumbbell, Clock, Target, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/lib/user-context"
import { HydrationTimeline } from "@/components/hydration-timeline"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  getUserDailyTimeline, 
  calculateUserHydrationGaps
} from "@/lib/hydration-data-functions"
import {
  getUserProfile,
  updateUserProfile
} from "@/lib/client-functions"

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
  const [userProfile, setUserProfile] = useState({
    weight: 70,
    sex: 'male' as 'male' | 'female',
    bodyType: 'average' as BodyType,
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
  
  // Load user data on component mount
  useEffect(() => {
    if (!user || !user.id) return;
    
    async function loadUserData() {      
      setIsLoading(true);
      try {
        // Calculate hydration gap using our hydration-data-functions
        const hydrationGapResult = await calculateUserHydrationGaps(user?.id || '');
        
        if (hydrationGapResult && user?.id) {
          // Set user profile
          const profile = await getUserProfile(user.id);
          if (profile) {
            setUserProfile({
              weight: profile.weight || 70,
              sex: profile.sex as 'male' | 'female' || 'male',
              bodyType: profile.body_type as BodyType || 'average',
            });
          }
          
          // Get timeline data using the new function
          const timelineData = await getUserDailyTimeline(user.id);
          if (timelineData && Array.isArray(timelineData)) {
            // Convert timeline items to UI events format
            const eventItems = timelineData
              .filter(item => item.type === 'log' || item.type === 'activity')
              .map(item => ({
                id: item.id,
                time: new Date(item.timestamp).toTimeString().slice(0, 5),
                type: item.item_category === 'drink' ? 'water' : 
                      item.item_category === 'activity' ? 'workout' : 'food',
                amount: item.quantity,
                description: item.item_name
              } as HydrationEvent));
            
            setEvents(eventItems);
          }
          
          // Set hydration gap data for the UI
          const hydrationData = {
            hydrationGap: hydrationGapResult.water_gap_ml,
            context: `Based on your ${hydrationGapResult.summary?.total_activity_minutes || 0} minutes of activity`,
            leanBodyMass: (profile?.weight || 70) * 0.7, // Estimate LBM as 70% of weight
            waterLoss: hydrationGapResult.water_gap_ml,
            waterFromFood: 0, // Not tracked in new system yet
            totalWaterInput: hydrationGapResult.summary?.total_water_ml || 0,
            recommendedIntake: (hydrationGapResult.summary?.total_water_ml || 0) + hydrationGapResult.water_gap_ml
          };
          
          setHydrationGapData(hydrationData);
          
          // Set daily target based on the gap calculation
          setDailyTarget({
            water_ml: hydrationData.recommendedIntake,
            protein_g: 0.8 * userProfile.weight, // 0.8g per kg of body weight
            sodium_mg: hydrationGapResult.sodium_gap_mg + (hydrationGapResult.summary?.total_sodium_mg || 0),
            potassium_mg: hydrationGapResult.potassium_gap_mg + (hydrationGapResult.summary?.total_potassium_mg || 0)
          });
        }
      } catch (error) {
        console.error('Error loading hydration data:', error);
        toast({
          title: "Error loading data",
          description: "There was a problem loading your hydration data."
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserData();
    
    // Setup the canvas animation (water drop effect)
    const setupCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = 60;
      canvas.height = 60;
      
      // Simple water drop animation
      let drops: {x: number, y: number, radius: number, speed: number}[] = [];
      
      const createDrop = () => {
        drops.push({
          x: Math.random() * canvas.width,
          y: 0,
          radius: 1 + Math.random() * 2,
          speed: 1 + Math.random() * 2
        });
      };
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw main water droplet
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#00FFFF';
        ctx.fill();
        
        // Draw ripples
        drops.forEach((drop, index) => {
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 255, 255, ${1 - drop.y / canvas.height})`;
          ctx.fill();
          
          drop.y += drop.speed;
          
          if (drop.y > canvas.height) {
            drops.splice(index, 1);
          }
        });
        
        if (Math.random() < 0.1) createDrop();
        
        requestAnimationFrame(animate);
      };
      
      animate();
    };
    
    setupCanvas();
  }, [user, toast]);
  
  // Function to update user profile
  async function updateProfile() {
    if (!user?.id) return;
    
    try {
      // Show loading toast
      toast({
        title: "Updating profile",
        description: "Saving your profile information..."
      });
      
      // Save profile to Supabase
      const updatedProfile = await updateUserProfile(user?.id || '', {
        weight: userProfile.weight,
        sex: userProfile.sex,
        // Convert the bodyType to a valid type that matches database schema
        body_type: userProfile.bodyType as any
      });
      
      if (updatedProfile) {
        // Close modal and show success toast
        setShowProfileModal(false);
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated."
        });
        
        // Refresh hydration calculations with new profile data
        const hydrationData = await calculateUserHydrationGaps(user.id);
        if (hydrationData) {
          setHydrationGapData({
            hydrationGap: hydrationData.water_gap_ml,
            context: `Based on your ${hydrationData.summary?.total_activity_minutes || 0} minutes of activity`,
            leanBodyMass: userProfile.weight * 0.7,
            waterLoss: hydrationData.water_gap_ml,
            waterFromFood: 0,
            totalWaterInput: hydrationData.summary?.total_water_ml || 0,
            recommendedIntake: (hydrationData.summary?.total_water_ml || 0) + hydrationData.water_gap_ml
          });
          
          setDailyTarget({
            water_ml: ((hydrationData.summary?.total_water_ml || 0) + hydrationData.water_gap_ml),
            protein_g: 0.8 * userProfile.weight,
            sodium_mg: hydrationData.sodium_gap_mg + (hydrationData.summary?.total_sodium_mg || 0),
            potassium_mg: hydrationData.potassium_gap_mg + (hydrationData.summary?.total_potassium_mg || 0)
          });
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "There was a problem saving your profile.",
        variant: "destructive"
      });
    }
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
              {user && user.id ? (
                <HydrationTimeline userId={user.id} />
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
        <div className="flex-1 p-6">
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
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : hydrationGapData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Water intake today</div>
                        <div className="text-2xl font-medium" style={{ color: "#00FFFF" }}>
                          {hydrationGapData.totalWaterInput.toLocaleString()}ml
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400 mb-1">Remaining</div>
                        <div className="text-2xl font-medium text-red-400">
                          {hydrationGapData.hydrationGap > 0
                            ? `+${hydrationGapData.hydrationGap.toLocaleString()}ml`
                            : "0ml"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${hydrationPercentage(
                            hydrationGapData.totalWaterInput,
                            hydrationGapData.recommendedIntake
                          )}%`,
                          background: "linear-gradient(90deg, #00FFFF 0%, #0080FF 100%)",
                          boxShadow: "0 0 8px rgba(0, 255, 255, 0.5)",
                        }}
                      />
                    </div>
                    
                    <div className="text-xs text-slate-400">
                      {hydrationGapData.context}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    No hydration data available
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
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400">Water</div>
                      <div className="text-lg font-medium" style={{ color: "#00FFFF" }}>
                        {dailyTarget.water_ml.toLocaleString()}ml
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${hydrationPercentage(
                              hydrationGapData?.totalWaterInput || 0,
                              dailyTarget.water_ml
                            )}%`,
                            background: "linear-gradient(90deg, #00FFFF 0%, #0080FF 100%)",
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400">Protein</div>
                      <div className="text-lg font-medium" style={{ color: "#FF6B9D" }}>
                        {dailyTarget.protein_g.toLocaleString()}g
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: "30%", // This would be calculated based on actual consumption
                            background: "linear-gradient(90deg, #FF6B9D 0%, #FF2D55 100%)",
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400">Sodium</div>
                      <div className="text-lg font-medium" style={{ color: "#FFD166" }}>
                        {dailyTarget.sodium_mg.toLocaleString()}mg
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: "45%", // This would be calculated based on actual consumption
                            background: "linear-gradient(90deg, #FFD166 0%, #FFB01F 100%)",
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400">Potassium</div>
                      <div className="text-lg font-medium" style={{ color: "#06D6A0" }}>
                        {dailyTarget.potassium_mg.toLocaleString()}mg
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: "20%", // This would be calculated based on actual consumption
                            background: "linear-gradient(90deg, #06D6A0 0%, #039E74 100%)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                <div className="flex items-center justify-center h-24">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : hydrationGapData && hydrationGapData.hydrationGap > 0 ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-400/10 border border-blue-400/30 rounded-md">
                    <div className="flex items-start">
                      <div className="mr-3 p-2 bg-blue-400/20 rounded-md">
                        <Droplets className="h-5 w-5" style={{ color: "#9D8DF1" }} />
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: "#9D8DF1" }}>
                          Hydration Gap Detected
                        </div>
                        <p className="text-sm text-slate-300 mt-1">
                          You need an additional {hydrationGapData.hydrationGap.toLocaleString()}ml of water today.
                          Consider adding an electrolyte drink if you've been active.
                        </p>
                      </div>
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
              <Label className="text-cyan-400">Body Type</Label>
              {userProfile.sex === 'male' ? (
                <Tabs
                  value={userProfile.bodyType}
                  onValueChange={(value) =>
                    setUserProfile({ ...userProfile, bodyType: value as BodyType })
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
                    setUserProfile({ ...userProfile, bodyType: value as BodyType })
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
