"use client"

import { useEffect, useRef } from "react"
import { Progress } from "@/components/ui/progress"

interface HydrationDialsProps {
  currentLevel: number
  goal: number
  percentComplete: number
  electrolytes: {
    sodium: { current: number; target: number }
    potassium: { current: number; target: number }
    magnesium: { current: number; target: number }
  }
}

export default function HydrationDials({ currentLevel, goal, percentComplete, electrolytes }: HydrationDialsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Draw the hydration dial
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const size = 200
    canvas.width = size
    canvas.height = size

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw background circle
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, 2 * Math.PI)
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
    ctx.fill()

    // Draw water level
    const waterAngle = (percentComplete / 100) * 2 * Math.PI
    ctx.beginPath()
    ctx.moveTo(size / 2, size / 2)
    ctx.arc(size / 2, size / 2, size / 2 - 10, -Math.PI / 2, waterAngle - Math.PI / 2, false)
    ctx.closePath()

    // Create gradient for water
    const gradient = ctx.createLinearGradient(0, 0, 0, size)
    gradient.addColorStop(0, "rgba(0, 150, 255, 0.8)")
    gradient.addColorStop(1, "rgba(0, 100, 255, 0.6)")
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw center circle
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 4, 0, 2 * Math.PI)
    ctx.fillStyle = "white"
    ctx.fill()
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw text
    ctx.fillStyle = "rgba(0, 100, 255, 0.9)"
    ctx.font = "bold 32px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${percentComplete}%`, size / 2, size / 2)

    // Draw smaller text
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
    ctx.font = "14px sans-serif"
    ctx.fillText(`${currentLevel}/${goal} ml`, size / 2, size / 2 + 25)
  }, [currentLevel, goal, percentComplete])

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Electrolytes</h3>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Sodium</span>
              <span>
                {electrolytes.sodium.current}/{electrolytes.sodium.target} mg
              </span>
            </div>
            <Progress
              value={(electrolytes.sodium.current / electrolytes.sodium.target) * 100}
              className="h-2 bg-gray-100 dark:bg-gray-700"
              indicatorClassName="bg-amber-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Potassium</span>
              <span>
                {electrolytes.potassium.current}/{electrolytes.potassium.target} mg
              </span>
            </div>
            <Progress
              value={(electrolytes.potassium.current / electrolytes.potassium.target) * 100}
              className="h-2 bg-gray-100 dark:bg-gray-700"
              indicatorClassName="bg-green-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Magnesium</span>
              <span>
                {electrolytes.magnesium.current}/{electrolytes.magnesium.target} mg
              </span>
            </div>
            <Progress
              value={(electrolytes.magnesium.current / electrolytes.magnesium.target) * 100}
              className="h-2 bg-gray-100 dark:bg-gray-700"
              indicatorClassName="bg-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
