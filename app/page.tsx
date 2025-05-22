"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  // Neon triangle animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 300
    canvas.height = 300

    let hue = 180
    let time = 0

    const drawNeonEffects = () => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const size = 100

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
      ctx.lineWidth = 3
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.8)`
      ctx.shadowBlur = 30
      ctx.stroke()

      // Draw floating particles
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2 + time
        const distance = 120 + Math.sin(time * 2 + i) * 20
        const x = centerX + Math.cos(angle) * distance
        const y = centerY + Math.sin(angle) * distance

        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${(hue + i * 10) % 360}, 100%, 80%, ${0.4 + Math.sin(time + i) * 0.2})`
        ctx.shadowColor = `hsla(${(hue + i * 10) % 360}, 100%, 70%, 0.8)`
        ctx.shadowBlur = 10
        ctx.fill()
      }

      // Draw pulsing glow
      ctx.beginPath()
      ctx.arc(centerX, centerY, 80 + Math.sin(time * 3) * 10, 0, Math.PI * 2)
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150)
      glowGradient.addColorStop(0, `hsla(${hue}, 100%, 80%, ${0.1 + Math.sin(time) * 0.05})`)
      glowGradient.addColorStop(1, `hsla(${hue}, 100%, 80%, 0)`)
      ctx.fillStyle = glowGradient
      ctx.fill()

      hue = (hue + 0.5) % 360
      time += 0.02
      requestAnimationFrame(drawNeonEffects)
    }

    drawNeonEffects()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <canvas ref={canvasRef} className="w-[300px] h-[300px] mx-auto" />
        <h1
          className="text-5xl font-light tracking-wider mt-4"
          style={{
            color: "#00FFFF",
            textShadow: "0 0 20px #00FFFF",
          }}
        >
          WATER BAR
        </h1>
        <p className="text-gray-300 mt-2 mb-12">Hydration Reimagined</p>

        <div className="flex flex-col gap-6 w-64 mx-auto">
          <Button
            className="bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30 py-6"
            style={{ color: "#00FFFF" }}
            onClick={() => router.push("/dashboard")}
          >
            <User className="h-5 w-5 mr-3" /> User Login
          </Button>
          <Button
            className="bg-pink-400/20 border border-pink-400/60 hover:bg-pink-400/30 py-6"
            style={{ color: "#FF6B9D" }}
            onClick={() => router.push("/staff")}
          >
            <Users className="h-5 w-5 mr-3" /> Staff Login
          </Button>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>
    </div>
  )
}
