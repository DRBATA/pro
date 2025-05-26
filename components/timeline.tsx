"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Droplet, Coffee, Utensils, Dumbbell } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getHydrationKit } from "@/lib/hydration-engine"

// Timeline event types aligned with hydration calculations
interface TimelineEvent {
  id: string
  date: string // Full date (YYYY-MM-DD)
  time: string // Time (HH:MM)
  type: "water" | "food" | "exercise" | "electrolyte" // Aligns with our 4 key components
  description: string
  // Type-specific properties
  water_amount_ml?: number // For water events
  food_type?: string // For food events
  food_water_content?: number // Water content in food (ml)
  activity_type?: string // For exercise events
  intensity?: "light" | "moderate" | "intense" // For exercise events
  duration?: number // Duration in minutes for exercise
  electrolyte_type?: string // For electrolyte intake events
  sodium_mg?: number // Sodium content (mg)
  potassium_mg?: number // Potassium content (mg)
  magnesium_mg?: number // Magnesium content (mg)
  // UI properties
  icon: "water" | "coffee" | "food" | "exercise"
}

// Mock data for timeline events (one week of data)
const mockEvents: TimelineEvent[] = [
  // Today's events
  {
    id: "1",
    date: new Date().toISOString().split('T')[0],
    time: "07:30",
    type: "exercise",
    activity_type: "hot_yoga",
    description: "Hot yoga session",
    duration: 45,
    intensity: "moderate",
    icon: "exercise",
  },
  {
    id: "2",
    date: new Date().toISOString().split('T')[0],
    time: "09:15",
    type: "water",
    water_amount_ml: 500,
    description: "Morning hydration",
    icon: "water",
  },
  {
    id: "3",
    date: new Date().toISOString().split('T')[0],
    time: "12:30",
    type: "food",
    food_type: "lunch",
    food_water_content: 250,
    description: "Lunch (salad & protein)",
    icon: "food",
  },
  {
    id: "4",
    date: new Date().toISOString().split('T')[0],
    time: "15:00",
    type: "exercise",
    activity_type: "run",
    duration: 30,
    intensity: "intense",
    description: "Afternoon run",
    icon: "exercise",
  },
  {
    id: "5",
    date: new Date().toISOString().split('T')[0],
    time: "16:30",
    type: "electrolyte",
    electrolyte_type: "sports_drink",
    sodium_mg: 200,
    potassium_mg: 150,
    description: "Post-workout electrolytes",
    icon: "water",
  },
  // Yesterday's events (simple example)
  {
    id: "6",
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: "08:00",
    type: "exercise",
    activity_type: "gym",
    duration: 60,
    intensity: "moderate",
    description: "Morning gym session",
    icon: "exercise",
  },
]

export default function Timeline({ user }) {
  const [events, setEvents] = useState<TimelineEvent[]>(mockEvents)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type: "water",
    description: "",
    icon: "water",
    water_amount_ml: 500,
  })
  const [recommendation, setRecommendation] = useState<string | null>(null)

  // Function to add a new event to the timeline
  const addEvent = () => {
    if (newEvent.type && newEvent.time) {
      // Create base event
      const event: TimelineEvent = {
        id: Date.now().toString(),
        date: newEvent.date || new Date().toISOString().split('T')[0],
        time: newEvent.time,
        type: newEvent.type as "water" | "food" | "exercise" | "electrolyte",
        description: newEvent.description || `${newEvent.type} activity`,
        icon: newEvent.icon as "water" | "coffee" | "food" | "exercise",
      }
      
      // Add type-specific properties
      switch(event.type) {
        case "water":
          event.water_amount_ml = newEvent.water_amount_ml || 500;
          break;
        case "food":
          event.food_type = newEvent.food_type || "meal";
          event.food_water_content = newEvent.food_water_content || 200;
          break;
        case "exercise":
          event.activity_type = newEvent.activity_type || "workout";
          event.intensity = newEvent.intensity || "moderate";
          event.duration = newEvent.duration || 30;
          break;
        case "electrolyte":
          event.electrolyte_type = newEvent.electrolyte_type || "drink";
          event.sodium_mg = newEvent.sodium_mg || 200;
          event.potassium_mg = newEvent.potassium_mg || 150;
          break;
      }

      const updatedEvents = [...events, event]
      setEvents(updatedEvents)
      setShowAddModal(false)
      
      // Calculate hydration impact of this event
      // This would ideally call a proper calculation function that uses our hydration-engine
      calculateHydrationImpact(event);
    }
  }
  
  // Calculate the hydration impact of an event
  const calculateHydrationImpact = (event: TimelineEvent) => {
    // In a real implementation, this would use the hydration-engine.ts functions
    // to calculate water balance, electrolyte needs, etc.
    
    let message = "";
    
    switch(event.type) {
      case "water":
        message = `Added ${event.water_amount_ml}ml of hydration.`;
        break;
      case "exercise":
        message = `You may need additional ${event.duration! * 10}ml of water to compensate for ${event.intensity} ${event.activity_type}.`;
        break;
      case "food":
        message = `Your meal provided approximately ${event.food_water_content}ml of water.`;
        break;
      case "electrolyte":
        message = `Replenished ${event.sodium_mg}mg sodium and ${event.potassium_mg}mg potassium.`;
        break;
    }
    
    setRecommendation(message);
  }

  const getIconComponent = (icon: string) => {
    switch (icon) {
      case "water":
        return <Droplet className="h-5 w-5 text-blue-500" />
      case "coffee":
        return <Coffee className="h-5 w-5 text-amber-700" />
      case "food":
        return <Utensils className="h-5 w-5 text-green-600" />
      case "exercise":
        return <Dumbbell className="h-5 w-5 text-purple-600" />
      default:
        return <Droplet className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Today's Hydration Timeline</h2>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Hydration Event</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Time
                </Label>
                <input
                  id="time"
                  type="time"
                  className="col-span-3 p-2 border rounded"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="activity" className="text-right">
                  Activity
                </Label>
                <Select onValueChange={(value) => setNewEvent({ ...newEvent, activity: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hiit">HIIT Workout</SelectItem>
                    <SelectItem value="hot_yoga">Hot Yoga</SelectItem>
                    <SelectItem value="run">Running</SelectItem>
                    <SelectItem value="work_laptop">Laptop Work</SelectItem>
                    <SelectItem value="desk">Desk Work</SelectItem>
                    <SelectItem value="brunch">Brunch</SelectItem>
                    <SelectItem value="meditation">Meditation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="icon" className="text-right">
                  Icon
                </Label>
                <Select
                  value={newEvent.icon}
                  onValueChange={(value) =>
                    setNewEvent({ ...newEvent, icon: value as "water" | "coffee" | "food" | "exercise" })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="coffee">Beverage</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <input
                  id="description"
                  className="col-span-3 p-2 border rounded"
                  value={newEvent.description || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              {/* Show intensity and duration only for exercise events */}
              {newEvent.icon === "exercise" && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="intensity" className="text-right">
                      Intensity
                    </Label>
                    <Select
                      value={newEvent.intensity}
                      onValueChange={(value) => setNewEvent({ ...newEvent, intensity: value as "light" | "moderate" | "intense" })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select intensity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="intense">Intense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="duration" className="text-right">
                      Duration (min)
                    </Label>
                    <input
                      id="duration"
                      type="number"
                      className="col-span-3 p-2 border rounded"
                      value={newEvent.duration || 30}
                      onChange={(e) => setNewEvent({ ...newEvent, duration: parseInt(e.target.value) || 30 })}
                      min="5"
                      max="240"
                    />
                  </div>
                </>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hydrationGap" className="text-right">
                  Hydration Gap
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="hydrationGap"
                    checked={newEvent.hydrationGap}
                    onCheckedChange={(checked) => setNewEvent({ ...newEvent, hydrationGap: checked })}
                  />
                  <Label htmlFor="hydrationGap">Missed hydration check-in</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={addEvent}>Add to Timeline</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timeline */}
      <div className="relative pl-8 border-l-2 border-gray-200 space-y-6 py-2">
        {events.map((event) => (
          <div key={event.id} className="relative">
            <div className="absolute -left-10 mt-1.5 h-6 w-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
              {getIconComponent(event.icon)}
            </div>
            {/* Event meta */}
            <div className="mt-1 flex justify-between">
              <div className="text-xs text-gray-500">
                {event.activity.replace("_", " ")}
                {event.icon === "exercise" && event.intensity && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-gray-100">
                    {event.intensity}
                  </span>
                )}
                {event.icon === "exercise" && event.duration && (
                  <span className="ml-1 text-[10px]">{event.duration}min</span>
                )}
              </div>
              <div className="text-xs text-gray-500">{event.time}</div>
            </div>
            <div className="mb-1 text-sm font-medium text-gray-500">{event.time}</div>
            <Card className="p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{event.description}</h3>
                  {event.hydrationGap && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                      Hydration Gap
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      {recommendation && (
        <Card className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-semibold mb-2">Your Hydration Recommendation</h3>
          <p className="text-sm text-gray-600 mb-3">Based on your timeline, we recommend:</p>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <h4 className="font-medium text-indigo-600">{recommendation}</h4>
            <p className="text-sm mt-1">
              {recommendation === "White Ember"
                ? "Cooling post-workout recovery with electrolytes"
                : recommendation === "Silver Mirage"
                  ? "Mental clarity boost for screen fatigue"
                  : recommendation === "Echo Spiral"
                    ? "Digestive support and rebalancing"
                    : recommendation === "Night Signal"
                      ? "Evening wind-down for restful sleep"
                      : recommendation === "Sky Salt"
                        ? "Balanced, sustained energy without stimulants"
                        : "Gentle cleansing and hormonal support"}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
