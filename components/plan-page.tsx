"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Cloud, CloudRain, Sun, Droplet, Clock } from "lucide-react"
import { mockRecommendations, mockVenues } from "@/lib/mock-data"
import type { Recommendation, Venue } from "@/lib/types"

interface PlanPageProps {
  user: any
}

export default function PlanPage({ user }: PlanPageProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(mockRecommendations)
  const [venues, setVenues] = useState<Venue[]>(mockVenues)
  const [weather, setWeather] = useState({
    temperature: 28,
    condition: "sunny",
    humidity: 65,
  })

  // Complete a recommendation
  const completeRecommendation = (id: string) => {
    setRecommendations(recommendations.map((rec) => (rec.id === id ? { ...rec, completed: true } : rec)))
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Today's Hydration Plan</CardTitle>
          <CardDescription>Personalized recommendations based on your profile and conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Today, {new Date().toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
                {weather.condition === "sunny" && <Sun className="h-10 w-10 text-amber-500" />}
                {weather.condition === "cloudy" && <Cloud className="h-10 w-10 text-gray-500" />}
                {weather.condition === "rainy" && <CloudRain className="h-10 w-10 text-blue-500" />}

                <div>
                  <div className="text-2xl font-bold">{weather.temperature}°C</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1)}, {weather.humidity}%
                    humidity
                  </div>
                </div>

                <div className="ml-auto text-sm text-gray-600 dark:text-gray-300">
                  <div>Recommended daily intake:</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400">
                    {user.profile.hydrationBaseline + 250} ml
                  </div>
                  <div className="text-xs text-gray-500">+250ml due to weather conditions</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Scheduled Hydration</h3>

                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-4 border rounded-lg flex items-center gap-4 ${
                      rec.completed
                        ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                        : "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                    </div>

                    <div className="flex-1">
                      <div className="font-medium">{rec.time}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {rec.name} • {rec.amount}ml
                      </div>
                      {rec.note && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rec.note}</div>}
                    </div>

                    <Button
                      variant={rec.completed ? "outline" : "default"}
                      size="sm"
                      disabled={rec.completed}
                      onClick={() => completeRecommendation(rec.id)}
                    >
                      {rec.completed ? "Completed" : "Complete"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-80 space-y-6">
              <div>
                <h3 className="font-medium mb-3">Nearby Refill Stations</h3>
                <div className="space-y-3">
                  {venues.map((venue) => (
                    <div key={venue.id} className="p-3 border rounded-lg bg-white dark:bg-slate-800">
                      <div className="font-medium">{venue.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Droplet className="h-3 w-3" />
                        <span>{venue.type}</span>
                        <span className="mx-1">•</span>
                        <span>{venue.distance}m away</span>
                      </div>
                      {venue.offer && (
                        <div className="mt-2 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-1.5 rounded">
                          {venue.offer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Hydration Tips</h3>
                <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Based on your activity level and the weather, try to drink water 30 minutes before your workout and
                    every 20 minutes during exercise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
