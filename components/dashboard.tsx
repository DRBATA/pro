"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import HydrationDials from "@/components/hydration-dials"
import Timeline from "@/components/timeline"
import ChatInterface from "@/components/chat-interface"
import { mockHydrationEvents } from "@/lib/mock-data"
import type { HydrationEvent } from "@/lib/types"

interface DashboardProps {
  user: any
}

export default function Dashboard({ user }: DashboardProps) {
  const [events, setEvents] = useState<HydrationEvent[]>(mockHydrationEvents)
  const [hydrationStats, setHydrationStats] = useState({
    currentLevel: 1300,
    goal: 2500,
    percentComplete: 52,
    electrolytes: {
      sodium: { current: 800, target: 1500 },
      potassium: { current: 350, target: 600 },
      magnesium: { current: 120, target: 200 },
    },
  })

  // Add a new hydration event
  const addEvent = (event: HydrationEvent) => {
    const newEvents = [...events, event]
    setEvents(newEvents)

    // Update hydration stats based on the new event
    if (event.type === "water" || event.type === "drink") {
      const newLevel = hydrationStats.currentLevel + event.amount
      const newPercent = Math.min(100, Math.round((newLevel / hydrationStats.goal) * 100))

      setHydrationStats({
        ...hydrationStats,
        currentLevel: newLevel,
        percentComplete: newPercent,
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Hydration Timeline</CardTitle>
            <CardDescription>Track your hydration throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <Timeline events={events} onAddEvent={addEvent} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hydration Status</CardTitle>
            <CardDescription>Your current hydration levels</CardDescription>
          </CardHeader>
          <CardContent>
            <HydrationDials
              currentLevel={hydrationStats.currentLevel}
              goal={hydrationStats.goal}
              percentComplete={hydrationStats.percentComplete}
              electrolytes={hydrationStats.electrolytes}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Drink Details</CardTitle>
            <CardDescription>Recommended drinks for your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="water">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="water">Water</TabsTrigger>
                <TabsTrigger value="electrolytes">Electrolytes</TabsTrigger>
                <TabsTrigger value="specialty">Specialty</TabsTrigger>
              </TabsList>
              <TabsContent value="water" className="space-y-4 mt-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">Pure Water</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Filtered water with optimal pH balance for maximum absorption.
                  </p>
                  <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">Recommended: 250ml every 2 hours</div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">Alkaline Water</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Higher pH water that may help neutralize acid in your bloodstream.
                  </p>
                  <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">Recommended: 500ml in the morning</div>
                </div>
              </TabsContent>
              <TabsContent value="electrolytes" className="space-y-4 mt-4">
                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <h3 className="font-medium text-cyan-700 dark:text-cyan-300">Electrolyte Boost</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Balanced electrolyte mix with sodium, potassium, and magnesium.
                  </p>
                  <div className="mt-2 text-sm text-cyan-600 dark:text-cyan-400">Recommended: 330ml after exercise</div>
                </div>
              </TabsContent>
              <TabsContent value="specialty" className="space-y-4 mt-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h3 className="font-medium text-purple-700 dark:text-purple-300">Chaga Infusion</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Antioxidant-rich mushroom infusion for immune support.
                  </p>
                  <div className="mt-2 text-sm text-purple-600 dark:text-purple-400">
                    Recommended: 200ml in the afternoon
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ChatInterface onAddEvent={addEvent} />
    </div>
  )
}
