"use client"

import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import type { NutritionState } from "@/types/hydration-types"

interface NutritionCardProps {
  nutrition: NutritionState | null
  isLoading: boolean
  error: string | null
}

export default function NutritionCard({ nutrition, isLoading, error }: NutritionCardProps) {
  if (isLoading) {
    return (
      <motion.div
        className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 h-64 flex items-center justify-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        style={{
          boxShadow: "0 0 15px rgba(0, 255, 170, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="animate-pulse text-purple-500">Loading nutrition data...</div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 h-64 flex items-center justify-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        style={{
          boxShadow: "0 0 15px rgba(255, 100, 100, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="text-red-500">{error}</div>
      </motion.div>
    )
  }

  if (!nutrition) return null

  return (
    <motion.div
      className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 neon-card"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      style={{
        boxShadow: "0 0 15px rgba(0, 255, 170, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
      }}
    >
      <h2 className="text-lg font-medium mb-4">Electrolyte Balance</h2>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-slate-700 mb-1">
            <span className="flex items-center">
              <Zap
                size={14}
                className="mr-1"
                style={{
                  color: "#00FFAA",
                  filter: "drop-shadow(0 0 3px rgba(0, 255, 170, 0.8))",
                }}
              />
              Sodium
            </span>
            <span>
              {nutrition.sodium_mg.current} / {nutrition.sodium_mg.target} mg
            </span>
          </div>
          <div className="h-3 bg-white/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full"
              style={{
                width: `${(nutrition.sodium_mg.current / nutrition.sodium_mg.target) * 100}%`,
                background: "linear-gradient(to right, #00FFAA, #00FFAA90)",
                boxShadow: "0 0 10px rgba(0, 255, 170, 0.5)",
              }}
              initial={{ width: 0 }}
              animate={{
                width: `${(nutrition.sodium_mg.current / nutrition.sodium_mg.target) * 100}%`,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm text-slate-700 mb-1">
            <span className="flex items-center">
              <Zap
                size={14}
                className="mr-1"
                style={{
                  color: "#00AAFF",
                  filter: "drop-shadow(0 0 3px rgba(0, 170, 255, 0.8))",
                }}
              />
              Potassium
            </span>
            <span>
              {nutrition.potassium_mg.current} / {nutrition.potassium_mg.target} mg
            </span>
          </div>
          <div className="h-3 bg-white/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full"
              style={{
                width: `${(nutrition.potassium_mg.current / nutrition.potassium_mg.target) * 100}%`,
                background: "linear-gradient(to right, #00AAFF, #00AAFF90)",
                boxShadow: "0 0 10px rgba(0, 170, 255, 0.5)",
              }}
              initial={{ width: 0 }}
              animate={{
                width: `${(nutrition.potassium_mg.current / nutrition.potassium_mg.target) * 100}%`,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm text-slate-700 mb-1">
            <span className="flex items-center">
              <Zap
                size={14}
                className="mr-1"
                style={{
                  color: "#FF9AAA",
                  filter: "drop-shadow(0 0 3px rgba(255, 154, 170, 0.8))",
                }}
              />
              Magnesium
            </span>
            <span>
              {nutrition.magnesium_mg.current} / {nutrition.magnesium_mg.target} mg
            </span>
          </div>
          <div className="h-3 bg-white/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full"
              style={{
                width: `${(nutrition.magnesium_mg.current / nutrition.magnesium_mg.target) * 100}%`,
                background: "linear-gradient(to right, #FF9AAA, #FF9AAA90)",
                boxShadow: "0 0 10px rgba(255, 154, 170, 0.5)",
              }}
              initial={{ width: 0 }}
              animate={{
                width: `${(nutrition.magnesium_mg.current / nutrition.magnesium_mg.target) * 100}%`,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-white/20 border border-white/20">
        <h3 className="text-base font-medium mb-2">Recommendation</h3>
        <p className="text-sm text-slate-700">
          Based on your activity level and the weather, consider adding a sports drink with sodium and potassium to your
          next hydration.
        </p>
      </div>
    </motion.div>
  )
}
