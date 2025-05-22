"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, LogIn, LogOut, Leaf } from "lucide-react"

type ToastProps = {
  isLoggedIn: boolean
  onLogin: () => void
  onLogout: () => void
  carbonSaved: number
  showCarbonSavedToast: boolean
  setShowCarbonSavedToast: (show: boolean) => void
  recentSaving?: number
}

export default function CarbonToast({
  isLoggedIn,
  onLogin,
  onLogout,
  carbonSaved,
  showCarbonSavedToast,
  setShowCarbonSavedToast,
  recentSaving = 0,
}: ToastProps) {
  const [showLoginToast, setShowLoginToast] = useState(false)

  // Auto-hide the carbon saved toast after 5 seconds
  useEffect(() => {
    if (showCarbonSavedToast) {
      const timer = setTimeout(() => {
        setShowCarbonSavedToast(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showCarbonSavedToast, setShowCarbonSavedToast])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center">
      {/* Login Status Toast - Always visible */}
      <motion.div
        className="mt-4 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          background: isLoggedIn ? "rgba(0, 255, 170, 0.2)" : "rgba(255, 255, 255, 0.2)",
          border: `1px solid ${isLoggedIn ? "rgba(0, 255, 170, 0.4)" : "rgba(255, 255, 255, 0.3)"}`,
          boxShadow: isLoggedIn ? "0 0 15px rgba(0, 255, 170, 0.3)" : "0 0 15px rgba(255, 255, 255, 0.2)",
        }}
      >
        {isLoggedIn ? (
          <>
            <CheckCircle
              size={16}
              className="text-[#00FFAA]"
              style={{ filter: "drop-shadow(0 0 3px rgba(0, 255, 170, 0.8))" }}
            />
            <span className="text-white text-sm">Logged in</span>
            <div className="h-4 w-px bg-white/30 mx-1"></div>
            <Leaf
              size={16}
              className="text-[#00FFAA]"
              style={{ filter: "drop-shadow(0 0 3px rgba(0, 255, 170, 0.8))" }}
            />
            <span
              className="text-white text-sm"
              style={{
                textShadow: "0 0 5px rgba(0, 255, 170, 0.5)",
              }}
            >
              {carbonSaved.toFixed(2)} kg CO₂ saved
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="ml-2 p-1 rounded-full bg-white/20 hover:bg-white/30"
              onClick={onLogout}
            >
              <LogOut size={14} className="text-white" />
            </motion.button>
          </>
        ) : (
          <>
            <LogIn
              size={16}
              className="text-white"
              style={{ filter: "drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" }}
            />
            <span className="text-white text-sm">Not logged in</span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="ml-2 p-1 rounded-full bg-white/20 hover:bg-white/30"
              onClick={onLogin}
            >
              <span className="text-white text-xs px-1">Login</span>
            </motion.button>
          </>
        )}
      </motion.div>

      {/* Carbon Saved Toast - Appears when carbon is saved */}
      <AnimatePresence>
        {showCarbonSavedToast && (
          <motion.div
            className="mt-4 px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-md"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            style={{
              background: "rgba(0, 255, 170, 0.2)",
              border: "1px solid rgba(0, 255, 170, 0.4)",
              boxShadow: "0 0 20px rgba(0, 255, 170, 0.4)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(0, 255, 170, 0.3)",
                boxShadow: "0 0 10px rgba(0, 255, 170, 0.5)",
              }}
            >
              <Leaf
                size={20}
                className="text-white"
                style={{ filter: "drop-shadow(0 0 5px rgba(0, 255, 170, 0.8))" }}
              />
            </div>
            <div>
              <h3 className="text-white font-medium" style={{ textShadow: "0 0 5px rgba(0, 255, 170, 0.5)" }}>
                Carbon Saved!
              </h3>
              <p className="text-white/90 text-sm">You saved {recentSaving.toFixed(2)} kg of CO₂ with this refill</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="ml-auto p-1 rounded-full bg-white/20 hover:bg-white/30"
              onClick={() => setShowCarbonSavedToast(false)}
            >
              <X size={16} className="text-white" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
