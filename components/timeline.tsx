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

// Simple types for timeline events
interface TimelineEvent {
  id: string
  time: string
  activity: string
  description: string
  hydrationGap: boolean
  icon: "water" | "coffee" | "food" | "exercise"
}

// Mock data for timeline events
const mockEvents: TimelineEvent[] = [
  {
    id: "1",
    time: "07:30",
    activity: "hot_yoga",
    description: "Hot yoga session",
    hydrationGap: true,
    icon: "exercise",
  },
  {
    id: "2",
    time: "12:00",
    activity: "desk",
    description: "Working at desk",
    hydrationGap: false,
    icon: "coffee",
  },
  {
    id: "3",
    time: "15:00",
    activity: "run",
    description: "Afternoon run",
    hydrationGap: true,
    icon: "exercise",
  },
]

export default function Timeline({ user }) {
  const [events, setEvents] = useState<TimelineEvent[]>(mockEvents)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
    time: "12:00",
    hydrationGap: false,
    icon: "water",
  })
  const [recommendation, setRecommendation] = useState<string | null>(null)

  const addEvent = () => {
    if (newEvent.activity && newEvent.time) {
      const event: TimelineEvent = {
        id: Date.now().toString(),
        time: newEvent.time,
        activity: newEvent.activity,
        description: newEvent.description || `${newEvent.activity} activity`,
        hydrationGap: newEvent.hydrationGap || false,
        icon: newEvent.icon as "water" | "coffee" | "food" | "exercise",
      }

      const updatedEvents = [...events, event]
      setEvents(updatedEvents)
      setShowAddModal(false)

      // Get recommendation based on latest event
      const kit = getHydrationKit(event.activity, event.hydrationGap)
      setRecommendation(kit)
    }
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
