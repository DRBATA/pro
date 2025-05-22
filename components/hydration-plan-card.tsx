"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Droplet, Plus } from "lucide-react"
import type { HydrationPlan } from "@/types/hydration-types"

interface HydrationPlanCardProps {
  plan: HydrationPlan | null
  isLoading: boolean
  error: string | null
}

export default function HydrationPlanCard({ plan, isLoading, error }: HydrationPlanCardProps) {
  const hydrationCanvasRef = useRef<HTMLCanvasElement>(null)
  const [rippleEffect, setRippleEffect] = useState(false)
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 })

  // Interactive hydration visualization
  useEffect(() => {
    if (!plan) return

    const canvas = hydrationCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Water properties
    const waterHeight = (canvas.height * plan.percent_complete) / 100
    const waterY = canvas.height - waterHeight

    // Wave properties
    let waveAmplitude = 5
    const waveFrequency = 0.02
    let wavePhase = 0
    const waveSpeed = 0.05

    // Ripple properties
    const ripples = []
    const addRipple = (x, y) => {
      ripples.push({
        x,
        y,
        radius: 0,
        maxRadius: 50 + Math.random() * 30,
        speed: 1 + Math.random() * 1,
        opacity: 0.8,
      })
    }

    // Add initial ripple if effect is active
    if (rippleEffect) {
      addRipple(ripplePosition.x * canvas.width, waterY - 10)
      setRippleEffect(false)
    }

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw water background
      const waterGradient = ctx.createLinearGradient(0, waterY, 0, canvas.height)
      waterGradient.addColorStop(0, "rgba(0, 180, 255, 0.4)")
      waterGradient.addColorStop(1, "rgba(0, 140, 255, 0.6)")

      ctx.fillStyle = waterGradient
      ctx.beginPath()
      ctx.moveTo(0, canvas.height)
      ctx.lineTo(0, waterY)

      // Draw wavy water surface
      for (let x = 0; x <= canvas.width; x += 5) {
        const y = waterY + Math.sin(x * waveFrequency + wavePhase) * waveAmplitude
        ctx.lineTo(x, y)
      }

      ctx.lineTo(canvas.width, canvas.height)
      ctx.closePath()
      ctx.fill()

      // Draw water glow
      ctx.shadowColor = "rgba(0, 200, 255, 0.8)"
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.moveTo(0, waterY)
      for (let x = 0; x <= canvas.width; x += 5) {
        const y = waterY + Math.sin(x * waveFrequency + wavePhase) * waveAmplitude
        ctx.lineTo(x, y)
      }
      ctx.lineTo(canvas.width, waterY)
      ctx.strokeStyle = "rgba(180, 240, 255, 0.8)"
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.shadowBlur = 0

      // Draw ripples
      ripples.forEach((ripple, index) => {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity})`
        ctx.lineWidth = 2
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
        ctx.stroke()

        // Update ripple
        ripple.radius += ripple.speed
        ripple.opacity -= 0.01

        // Remove faded ripples
        if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
          ripples.splice(index, 1)
        }
      })

      // Update wave phase for animation
      wavePhase += waveSpeed
      waveAmplitude = 3 + Math.sin(Date.now() / 1000) * 2

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [plan, rippleEffect, ripplePosition])

  // Simulate completing a recommendation
  const completeRecommendation = (id: string) => {
    // In a real app, this would call an API endpoint
    // For demo, we'll just trigger the ripple effect
    setRippleEffect(true)
    setRipplePosition({ x: 0.5 + (Math.random() * 0.4 - 0.2), y: 0 })
  }

  if (isLoading) {
    return (
      <motion.div
        className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 h-64 flex items-center justify-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          boxShadow: "0 0 15px rgba(0, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="animate-pulse text-cyan-500">Loading hydration plan...</div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 h-64 flex items-center justify-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          boxShadow: "0 0 15px rgba(255, 100, 100, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="text-red-500">{error}</div>
      </motion.div>
    )
  }

  if (!plan) return null

  return (
    <motion.div
      className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 neon-card"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        boxShadow: "0 0 15px rgba(0, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium flex items-center">
          <Droplet
            size={18}
            className="mr-1 neon-icon"
            style={{
              filter: "drop-shadow(0 0 5px rgba(0, 255, 255, 0.8))",
              color: "#00FFFF",
            }}
          />
          <span className="neon-text-subtle">Hydration Level</span>
        </h2>
        <span
          className="text-2xl font-light neon-text"
          style={{
            color: "#00FFFF",
            textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
          }}
        >
          {plan.percent_complete}%
        </span>
      </div>

      <div className="h-24 bg-white/40 rounded-xl overflow-hidden relative neon-progress">
        <canvas ref={hydrationCanvasRef} className="absolute inset-0 w-full h-full" />
      </div>

      <div className="mt-2 flex justify-between text-sm">
        <span>
          {plan.current_ml} / {plan.goal_ml} mL
        </span>
        <span
          className="font-medium"
          style={{
            color: plan.percent_complete < 50 ? "#FF9AAA" : plan.percent_complete < 75 ? "#00AAFF" : "#00FFAA",
            textShadow: `0 0 5px rgba(${
              plan.percent_complete < 50 ? "255, 154, 170" : plan.percent_complete < 75 ? "0, 170, 255" : "0, 255, 170"
            }, 0.5)`,
          }}
        >
          {plan.percent_complete < 50
            ? "Drink more!"
            : plan.percent_complete < 75
              ? "Getting there!"
              : "Well hydrated!"}
        </span>
      </div>

      {/* Advice */}
      <div className="mt-4 p-3 rounded-xl bg-white/30 border border-white/30">
        <h3 className="text-base font-medium mb-1">Today's Plan</h3>
        <p className="text-sm text-slate-700">{plan.advice}</p>
      </div>

      {/* Recommendations */}
      {plan.recommendations && plan.recommendations.length > 0 && (
        <div className="mt-4">
          <h3 className="text-base font-medium mb-2">Recommended Drinks</h3>
          <div className="space-y-3">
            {plan.recommendations.map((rec) => (
              <motion.div
                key={rec.id}
                className="p-3 rounded-xl bg-white/20 border border-white/20 flex justify-between items-center"
                whileHover={{
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  boxShadow: `0 0 15px ${rec.color}50`,
                }}
                style={{
                  opacity: rec.completed ? 0.6 : 1,
                  textDecoration: rec.completed ? "line-through" : "none",
                  borderColor: `${rec.color}50`,
                }}
              >
                <div className="flex items-center">
                  <div
                    className="w-10 h-10 rounded-full mr-3 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${rec.color}50, ${rec.color}30)`,
                      boxShadow: `0 0 10px ${rec.color}50`,
                    }}
                  >
                    <Droplet size={20} className="text-white" style={{ filter: `drop-shadow(0 0 3px ${rec.color})` }} />
                  </div>
                  <div>
                    <div className="text-slate-800">{rec.name}</div>
                    <div className="text-sm text-slate-600">{rec.time}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-slate-800 mr-3">{rec.amount} mL</span>
                  {!rec.completed && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(to right, ${rec.color}, ${rec.color}90)`,
                        boxShadow: `0 0 10px ${rec.color}50`,
                      }}
                      onClick={() => completeRecommendation(rec.id)}
                    >
                      <Plus size={18} className="text-white" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
