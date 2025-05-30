"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function HydrationDashboard({ user }) {
  // Mock hydration data
  const hydrationData = {
    goal: 2500,
    current: 1300,
    percentage: 52,
    recommendations: [
      { id: "1", name: "Water", amount: 250, time: "Now", completed: false },
      { id: "2", name: "Electrolyte Drink", amount: 330, time: "2:00 PM", completed: false },
      { id: "3", name: "Water", amount: 250, time: "4:30 PM", completed: false },
    ],
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="riad-card palm-leaf-shadow">
        <CardHeader className="pb-2 border-b border-riad-sand">
          <CardTitle className="text-lg font-medium text-riad-emerald neon-text">Daily Hydration</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Water Progress</span>
                <span className="text-sm font-medium">{hydrationData.percentage}%</span>
              </div>
              <div className="relative h-6 riad-pool overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full transition-all duration-1000 ease-in-out" 
                  style={{ width: `${hydrationData.percentage}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between text-sm pt-2">
              <div className="riad-tile-border p-3">
                <p className="text-gray-500 mb-1">Current</p>
                <p className="text-2xl font-bold text-riad-emerald">{hydrationData.current}ml</p>
              </div>
              <div className="riad-tile-border p-3 text-right">
                <p className="text-gray-500 mb-1">Goal</p>
                <p className="text-2xl font-bold text-riad-emerald">{hydrationData.goal}ml</p>
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      <div className="riad-card palm-leaf-shadow">
        <CardHeader className="pb-2 border-b border-riad-sand">
          <CardTitle className="text-lg font-medium text-riad-emerald neon-text">Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-5">
            {hydrationData.recommendations.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-3 border border-riad-sand hover:border-riad-emerald transition-colors duration-300">
                <div>
                  <p className="font-medium text-riad-emerald">{rec.name}</p>
                  <p className="text-sm text-gray-500">{rec.amount}ml at {rec.time}</p>
                </div>
                <button className="bg-riad-emerald hover:bg-riad-emerald-light text-white px-4 py-2 text-sm transition-colors duration-300">
                  Add
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </div>
    </div>
  )
}
