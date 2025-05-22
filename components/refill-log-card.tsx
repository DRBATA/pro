"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Droplet, Plus } from "lucide-react"

interface RefillLogCardProps {
  onLogBeverage: (logData: any) => void
}

export default function RefillLogCard({ onLogBeverage }: RefillLogCardProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null)
  const [customVolume, setCustomVolume] = useState(250)

  // Drink options
  const drinks = [
    { id: "water", name: "Water", color: "#00FFFF", electrolytes: 0, volume: 250, carbonSaving: 0.33 },
    { id: "sport", name: "Sport Drink", color: "#00AAFF", electrolytes: 150, volume: 330, carbonSaving: 0.45 },
    { id: "coconut", name: "Coconut Water", color: "#00FFAA", electrolytes: 200, volume: 300, carbonSaving: 0.4 },
    { id: "mineral", name: "Mineral Water", color: "#FF9AAA", electrolytes: 50, volume: 250, carbonSaving: 0.33 },
  ]

  const handleAddWater = (drinkId: string, isRefill = false) => {
    const drink = drinks.find((d) => d.id === drinkId)
    if (!drink) return

    // Prepare log data
    const logData = {
      name: drink.name,
      volume_ml: isRefill ? customVolume : drink.volume,
      sodium_mg: drink.electrolytes > 0 ? Math.round(drink.electrolytes * 0.4) : 0,
      potassium_mg: drink.electrolytes > 0 ? Math.round(drink.electrolytes * 0.6) : 0,
      electrolytes: drink.electrolytes > 0,
      refillStation: isRefill,
    }

    // Log the beverage
    onLogBeverage(logData)

    // Close modal if open
    setShowAddModal(false)
    setSelectedDrink(null)
  }

  return (
    <motion.div
      className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 neon-card"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{
        boxShadow: "0 0 15px rgba(0, 170, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium">Log Hydration</h2>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/40 neon-icon-button"
          onClick={() => setShowAddModal(true)}
          style={{
            boxShadow: "0 0 10px rgba(0, 170, 255, 0.3)",
            border: "1px solid rgba(0, 170, 255, 0.3)",
          }}
        >
          <Plus
            size={18}
            style={{
              color: "#00AAFF",
              filter: "drop-shadow(0 0 3px rgba(0, 170, 255, 0.8))",
            }}
          />
        </button>
      </div>

      {/* Quick Add Drinks */}
      <div className="grid grid-cols-2 gap-3">
        {drinks.map((drink) => (
          <motion.button
            key={drink.id}
            className="p-3 rounded-xl flex flex-col items-center justify-center gap-2 border border-white/30 bg-white/20 neon-drink-button"
            whileHover={{
              y: -3,
              backgroundColor: "rgba(255,255,255,0.3)",
              boxShadow: `0 0 15px ${drink.color}50, inset 0 0 5px ${drink.color}30`,
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAddWater(drink.id)}
            style={{
              boxShadow: `0 0 10px ${drink.color}30`,
              border: `1px solid ${drink.color}30`,
            }}
          >
            <div
              className="w-6 h-10 rounded-full relative neon-bottle-small"
              style={{
                background: `linear-gradient(to bottom, ${drink.color}80, ${drink.color})`,
                boxShadow: `0 0 10px ${drink.color}80, inset 0 0 5px rgba(255, 255, 255, 0.5)`,
              }}
            >
              <div
                className="absolute top-1 left-1 right-1 h-2 rounded-full"
                style={{ background: "rgba(255,255,255,0.5)" }}
              ></div>
            </div>
            <span
              className="text-sm font-light"
              style={{
                color: drink.color,
                textShadow: `0 0 5px ${drink.color}80`,
              }}
            >
              {drink.name}
            </span>
            <span className="text-xs opacity-70">{drink.volume} mL</span>
          </motion.button>
        ))}
      </div>

      {/* Refill Station Button */}
      <div className="mt-4">
        <motion.button
          className="w-full p-3 rounded-xl flex items-center justify-center gap-3 border border-[#00FFAA]/30 bg-white/20"
          whileHover={{
            backgroundColor: "rgba(255,255,255,0.3)",
            boxShadow: "0 0 15px rgba(0, 255, 170, 0.3), inset 0 0 5px rgba(0, 255, 170, 0.1)",
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          style={{
            boxShadow: "0 0 10px rgba(0, 255, 170, 0.2)",
          }}
        >
          <Droplet
            size={20}
            style={{
              color: "#00FFAA",
              filter: "drop-shadow(0 0 3px rgba(0, 255, 170, 0.8))",
            }}
          />
          <span
            style={{
              color: "#00FFAA",
              textShadow: "0 0 5px rgba(0, 255, 170, 0.5)",
            }}
          >
            Log Refill Station Visit
          </span>
        </motion.button>
      </div>

      {/* Add Drink Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white/80 backdrop-blur-md rounded-2xl p-6 w-full max-w-md border border-white/50 neon-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: "0 0 30px rgba(0, 200, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.2)",
            }}
          >
            <h2
              className="text-xl font-light mb-4 text-slate-800 neon-text-modal"
              style={{
                color: "#00AAFF",
                textShadow: "0 0 5px rgba(0, 170, 255, 0.5)",
              }}
            >
              Add Hydration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 text-sm mb-2">Drink Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {drinks.map((drink) => (
                    <motion.button
                      key={drink.id}
                      className={`p-3 rounded-lg text-center ${
                        selectedDrink === drink.id ? "neon-drink-selected" : "bg-white/50 border border-white/50"
                      }`}
                      style={{
                        borderColor: selectedDrink === drink.id ? drink.color : undefined,
                        color: selectedDrink === drink.id ? drink.color : "inherit",
                        boxShadow: selectedDrink === drink.id ? `0 0 15px ${drink.color}80` : undefined,
                        textShadow: selectedDrink === drink.id ? `0 0 5px ${drink.color}80` : undefined,
                      }}
                      whileHover={{
                        backgroundColor: "rgba(255,255,255,0.8)",
                        boxShadow: `0 0 10px ${drink.color}50`,
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDrink(drink.id)}
                    >
                      {drink.name}
                      <div className="text-xs mt-1 text-[#00FFAA]">Saves {drink.carbonSaving} kg CO₂</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-sm mb-2">Amount (ml)</label>
                <input
                  type="number"
                  value={customVolume}
                  onChange={(e) => setCustomVolume(Number.parseInt(e.target.value) || 250)}
                  className="w-full bg-white/50 border border-white/50 rounded-lg py-3 px-4 text-slate-800 neon-input"
                  style={{
                    boxShadow: "0 0 10px rgba(0, 170, 255, 0.2), inset 0 0 5px rgba(255, 255, 255, 0.2)",
                  }}
                />
              </div>

              <div className="flex items-center">
                <input type="checkbox" id="refill-station" className="mr-2" />
                <label htmlFor="refill-station" className="text-slate-700">
                  I used a refill station (saves plastic)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <motion.button
                  className="px-4 py-2 rounded-md bg-transparent text-slate-600 border border-slate-300"
                  onClick={() => setShowAddModal(false)}
                  whileHover={{
                    backgroundColor: "rgba(255,255,255,0.5)",
                    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="px-4 py-2 rounded-md text-white neon-button-primary"
                  style={{
                    background: "linear-gradient(to right, #00FFAA, #00AAFF)",
                    boxShadow: "0 0 15px rgba(0, 200, 255, 0.3)",
                  }}
                  onClick={() => {
                    if (selectedDrink) {
                      const isRefill = document.getElementById("refill-station")?.checked || false
                      handleAddWater(selectedDrink, isRefill)
                    }
                  }}
                  whileHover={{
                    boxShadow: "0 0 20px rgba(0, 200, 255, 0.5), inset 0 0 5px rgba(255, 255, 255, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
