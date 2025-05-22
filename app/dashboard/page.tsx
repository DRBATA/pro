"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Droplets, Dumbbell, Clock, Target, User, ShoppingBag, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Body type multipliers
const BODY_TYPES = {
  muscular: { name: "Muscular", multiplier: 1.1, color: "#00FF88" },
  average: { name: "Average", multiplier: 1.0, color: "#00FFFF" },
  stocky: { name: "Stocky/Curvy", multiplier: 0.9, color: "#FF6B9D" },
}

// Event types
interface HydrationEvent {
  id: string
  time: string
  type: "water" | "protein" | "electrolyte" | "workout"
  amount?: number
  preWeight?: number
  postWeight?: number
  description: string
}

// Order type
interface Order {
  id: string
  kitName: string
  status: "pending" | "in-progress" | "completed"
  timestamp: string
  location?: string
}

// Calculate daily needs based on weight and body type
const calculateDailyNeeds = (weight: number, bodyType: keyof typeof BODY_TYPES) => {
  const adjustedWeight = weight * BODY_TYPES[bodyType].multiplier
  return {
    water: Math.round(adjustedWeight * 35), // 35ml per kg
    protein: Math.round(adjustedWeight * 1.2), // 1.2g per kg
    sodium: Math.round(adjustedWeight * 20), // 20mg per kg
    potassium: Math.round(adjustedWeight * 40), // 40mg per kg
  }
}

export default function UserDashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [userProfile, setUserProfile] = useState({
    weight: 75,
    bodyType: "average" as keyof typeof BODY_TYPES,
  })
  const [events, setEvents] = useState<HydrationEvent[]>([
    {
      id: "1",
      time: "08:00",
      type: "water",
      amount: 500,
      description: "Morning hydration",
    },
    {
      id: "2",
      time: "10:30",
      type: "workout",
      preWeight: 75.2,
      postWeight: 74.4,
      description: "HIIT session",
    },
    {
      id: "3",
      time: "11:00",
      type: "electrolyte",
      amount: 330,
      description: "Post-workout recovery",
    },
  ])
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

  useEffect(() => {
    // Set a default recommendation if none exists
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
  const dailyNeeds = calculateDailyNeeds(userProfile.weight, userProfile.bodyType)
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

  const addEvent = () => {
    if (newEvent.type && newEvent.time) {
      const event: HydrationEvent = {
        id: Date.now().toString(),
        time: newEvent.time!,
        type: newEvent.type as any,
        amount: newEvent.amount,
        preWeight: newEvent.preWeight,
        postWeight: newEvent.postWeight,
        description: newEvent.description || `${newEvent.type} event`,
      }

      setEvents([...events, event].sort((a, b) => a.time.localeCompare(b.time)))
      setShowAddModal(false)
      setNewEvent({ time: new Date().toTimeString().slice(0, 5), type: "water" })

      // Generate recommendation based on latest event
      if (event.type === "workout" && event.preWeight && event.postWeight) {
        const sweatLoss = (event.preWeight - event.postWeight) * 1000
        setRecommendation({
          text: `Heavy session detected! You lost ${sweatLoss}ml in sweat. Drink ${Math.round(sweatLoss * 1.2)}ml with electrolytes to restore balance.`,
          kit: "White Ember",
        })
      }

      // Save to database (simulated)
      toast({
        title: "Event Added",
        description: "Your hydration event has been recorded.",
      })
    }
  }

  const completeSweatTest = () => {
    const sweatLoss = (sweatTest.preWeight - sweatTest.postWeight) * 1000
    const sweatRate = sweatLoss / sweatTest.duration

    // Add workout event
    const event: HydrationEvent = {
      id: Date.now().toString(),
      time: new Date().toTimeString().slice(0, 5),
      type: "workout",
      preWeight: sweatTest.preWeight,
      postWeight: sweatTest.postWeight,
      description: `${sweatTest.duration}-min Sweat Test`,
    }

    setEvents([...events, event].sort((a, b) => a.time.localeCompare(b.time)))

    // Set recommendation based on sweat rate
    setRecommendation({
      text: `Sweat test complete! Your sweat rate is ${Math.round(sweatRate)}ml/min. We recommend the Frost Echo kit with electrolytes to match your sweat profile.`,
      kit: "Frost Echo",
    })

    setShowSweatTestModal(false)

    toast({
      title: "Sweat Test Completed",
      description: `Your sweat rate is ${Math.round(sweatRate)}ml per minute.`,
    })
  }

  const updateProfile = () => {
    // Save to database (simulated)
    toast({
      title: "Profile Updated",
      description: `Your profile has been updated with weight: ${userProfile.weight}kg and body type: ${BODY_TYPES[userProfile.bodyType].name}.`,
    })

    setShowProfileModal(false)
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "water":
      case "electrolyte":
        return <Droplets className="h-4 w-4" />
      case "workout":
        return <Dumbbell className="h-4 w-4" />
      case "protein":
        return <Target className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "water":
        return "#00FFFF"
      case "electrolyte":
        return "#4FC3F7"
      case "workout":
        return "#FF6B9D"
      case "protein":
        return "#00FF88"
      default:
        return "#B388FF"
    }
  }

  const hydrationPercentage = Math.min(
    100,
    Math.round(((currentIntake.water - currentIntake.sweatLoss) / dailyNeeds.water) * 100),
  )

  const purchaseKit = () => {
    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter your current location for delivery",
        variant: "destructive",
      })
      return
    }

    const newOrder: Order = {
      id: Date.now().toString(),
      kitName: kitToPurchase,
      status: "pending",
      timestamp: new Date().toISOString(),
      location: location,
    }

    setOrders([...orders, newOrder])
    setShowLocationModal(false)
    setLocation("")

    toast({
      title: "Kit Ordered!",
      description: `Your ${kitToPurchase} kit will be prepared and delivered to you shortly.`,
      variant: "default",
    })

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
              {userProfile.weight}kg • {BODY_TYPES[userProfile.bodyType].name}
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
                    value="average"
                    className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300"
                  >
                    Average
                  </TabsTrigger>
                  <TabsTrigger
                    value="stocky"
                    className="data-[state=active]:bg-pink-400/20 data-[state=active]:text-pink-300"
                  >
                    Stocky
                  </TabsTrigger>
                </TabsList>
              </Tabs>
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
            <DialogTitle style={{ color: "#FF6B9D" }}>15-Minute Sweat Test</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <p className="text-sm">
              Record your weight before and after a 15-minute intense workout to calculate your personal sweat rate.
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

            <div className="p-3 bg-pink-400/10 rounded-md border border-pink-400/30">
              <p className="text-sm">
                Calculated sweat loss:{" "}
                <strong>{Math.round((sweatTest.preWeight - sweatTest.postWeight) * 1000)}ml</strong>
              </p>
              <p className="text-sm">
                Sweat rate:{" "}
                <strong>
                  {Math.round(((sweatTest.preWeight - sweatTest.postWeight) * 1000) / sweatTest.duration)}ml/min
                </strong>
              </p>
            </div>
          </div>
          <Button
            onClick={completeSweatTest}
            className="bg-pink-400/20 border border-pink-400/60 hover:bg-pink-400/30"
            style={{ color: "#FF6B9D" }}
          >
            Complete Test
          </Button>
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
