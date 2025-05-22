"use client"

import { useEffect, useRef } from "react"

export default function SimpleNeonLine() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions to match window width
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = 60 // Fixed height for the line area
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Line properties
    const lineY = canvas.height / 2
    const lineWidth = 2

    // Animation variables
    let position = 0
    const speed = 2

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw base line
      ctx.beginPath()
      ctx.strokeStyle = "rgba(0, 150, 255, 0.3)"
      ctx.lineWidth = lineWidth
      ctx.moveTo(0, lineY)
      ctx.lineTo(canvas.width, lineY)
      ctx.stroke()

      // Create flowing gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)

      // Create the flowing effect by shifting gradient positions
      gradient.addColorStop(position % 1, "rgba(0, 200, 255, 0.1)") // Dim blue
      gradient.addColorStop((position + 0.1) % 1, "rgba(120, 220, 255, 0.8)") // Bright blue
      gradient.addColorStop((position + 0.2) % 1, "rgba(180, 240, 255, 0.9)") // Bright cyan
      gradient.addColorStop((position + 0.3) % 1, "rgba(120, 220, 255, 0.8)") // Bright blue
      gradient.addColorStop((position + 0.4) % 1, "rgba(0, 200, 255, 0.1)") // Dim blue

      // Draw glowing line with gradient
      ctx.beginPath()
      ctx.strokeStyle = gradient
      ctx.lineWidth = lineWidth + 6
      ctx.shadowColor = "rgba(0, 200, 255, 0.8)"
      ctx.shadowBlur = 15
      ctx.moveTo(0, lineY)
      ctx.lineTo(canvas.width, lineY)
      ctx.stroke()

      // Reset shadow for clean rendering
      ctx.shadowBlur = 0

      // Draw bright core
      ctx.beginPath()
      ctx.strokeStyle = "rgba(220, 240, 255, 0.9)"
      ctx.lineWidth = lineWidth
      ctx.moveTo(0, lineY)
      ctx.lineTo(canvas.width, lineY)
      ctx.stroke()

      // Update position for flowing effect
      position = (position + speed / 1000) % 1

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <div className="flex items-center justify-center h-screen bg-[#001428]">
      <canvas ref={canvasRef} className="absolute bottom-0 left-0 right-0" style={{ height: "60px" }} />
    </div>
  )
}
