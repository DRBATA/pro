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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Daily Hydration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm font-medium">{hydrationData.percentage}%</span>
              </div>
              <Progress value={hydrationData.percentage} className="h-2" />
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-gray-500">Current</p>
                <p className="text-2xl font-bold">{hydrationData.current}ml</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">Goal</p>
                <p className="text-2xl font-bold">{hydrationData.goal}ml</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hydrationData.recommendations.map((rec) => (
              <div key={rec.id} className="flex justify-between items-center p-2 border rounded-md">
                <div>
                  <p className="font-medium">{rec.name}</p>
                  <p className="text-sm text-gray-500">
                    {rec.amount}ml • {rec.time}
                  </p>
                </div>
                <input type="checkbox" className="h-5 w-5 rounded border-gray-300" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
