"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Leaf } from "lucide-react"
import type { CarbonSavings } from "@/types/hydration-types"

interface CarbonSavingsCardProps {
  carbonSavings: CarbonSavings | null
  isLoading: boolean
  error: string | null
}

export default function CarbonSavingsCard({ carbonSavings, isLoading, error }: CarbonSavingsCardProps) {
  const [showToast, setShowToast] = useState(false)

  // Show toast when there's a recent saving
  useEffect(() => {
    if (carbonSavings?.recent_saving) {
      setShowToast(true)
      const timer = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [carbonSavings?.recent_saving])

  if (isLoading) {
    return (
      <motion.div
        className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 h-64 flex items-center justify-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{
          boxShadow: "0 0 15px rgba(0, 255, 170, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="animate-pulse text-green-500">Loading carbon savings...</div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 h-64 flex items-center justify-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{
          boxShadow: "0 0 15px rgba(255, 100, 100, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="text-red-500">{error}</div>
      </motion.div>
    )
  }

  if (!carbonSavings) return null

  return (
    <>
      <motion.div
        className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 neon-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{
          boxShadow: "0 0 15px rgba(0, 255, 170, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium flex items-center">
            <Leaf
              size={18}
              className="mr-1"
              style={{
                color: "#00FFAA",
                filter: "drop-shadow(0 0 5px rgba(0, 255, 170, 0.8))",
              }}
            />
            <span>Carbon Savings</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-white/20 border border-white/20 flex flex-col items-center justify-center">
            <div className="text-sm text-slate-600 mb-1">CO₂ Saved</div>
            <div
              className="text-2xl font-light"
              style={{
                color: "#00FFAA",
                textShadow: "0 0 5px rgba(0, 255, 170, 0.5)",
              }}
            >
              {carbonSavings.total_kg_saved.toFixed(2)} kg
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/20 border border-white/20 flex flex-col items-center justify-center">
            <div className="text-sm text-slate-600 mb-1">Bottles Avoided</div>
            <div
              className="text-2xl font-light"
              style={{
                color: "#00AAFF",
                textShadow: "0 0 5px rgba(0, 170, 255, 0.5)",
              }}
            >
              {carbonSavings.bottles_saved}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/20 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600 mb-1">Environmental Impact</div>
              <div className="text-base">
                Equivalent to planting{" "}
                <span
                  style={{
                    color: "#00FFAA",
                    textShadow: "0 0 3px rgba(0, 255, 170, 0.5)",
                  }}
                >
                  {carbonSavings.trees_equivalent} trees
                </span>
              </div>
            </div>
            <div className="text-4xl">🌳</div>
          </div>
        </div>
      </motion.div>

      {/* Carbon Saved Toast */}
      <AnimatePresence>
        {showToast && carbonSavings.recent_saving && (
          <motion.div
            className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-md rounded-xl p-4 border border-[#00FFAA] shadow-lg"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            style={{
              boxShadow: "0 0 20px rgba(0, 255, 170, 0.4)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(0, 255, 170, 0.3), rgba(0, 170, 255, 0.3))",
                  boxShadow: "0 0 10px rgba(0, 255, 170, 0.3)",
                }}
              >
                <Leaf
                  size={20}
                  style={{
                    color: "#00FFAA",
                    filter: "drop-shadow(0 0 3px rgba(0, 255, 170, 0.8))",
                  }}
                />
              </div>
              <div>
                <div className="font-medium">Carbon Saved!</div>
                <div className="text-sm text-slate-600">
                  You just saved{" "}
                  <span
                    style={{
                      color: "#00FFAA",
                      textShadow: "0 0 3px rgba(0, 255, 170, 0.5)",
                    }}
                  >
                    {carbonSavings.recent_saving.amount_kg.toFixed(2)} kg
                  </span>{" "}
                  of CO₂
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
