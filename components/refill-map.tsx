"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Navigation, Droplet, Coffee, Utensils, X, ChevronRight } from "lucide-react"

// Types for refill stations and partner venues
type RefillStation = {
  id: string
  name: string
  address: string
  distance: number // in meters
  coordinates: [number, number] // [latitude, longitude]
  type: "public" | "cafe" | "restaurant" | "gym"
  hasFood: boolean
  offers?: string[]
}

type Coordinates = {
  latitude: number
  longitude: number
}

export default function RefillMap() {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [isNearbyAlertShown, setIsNearbyAlertShown] = useState(false)
  const [selectedStation, setSelectedStation] = useState<RefillStation | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Sample refill stations data
  const refillStations: RefillStation[] = [
    {
      id: "1",
      name: "Central Park Fountain",
      address: "Central Park, Main Entrance",
      distance: 120,
      coordinates: [40.7812, -73.9665],
      type: "public",
      hasFood: false,
    },
    {
      id: "2",
      name: "Green Cafe",
      address: "123 Eco Street",
      distance: 350,
      coordinates: [40.7789, -73.9637],
      type: "cafe",
      hasFood: true,
      offers: ["10% off with refill", "Vegan options available"],
    },
    {
      id: "3",
      name: "Hydrate Gym",
      address: "45 Fitness Avenue",
      distance: 550,
      coordinates: [40.7756, -73.9689],
      type: "gym",
      hasFood: true,
      offers: ["Free refill with membership", "Protein smoothies"],
    },
    {
      id: "4",
      name: "Eco Restaurant",
      address: "78 Green Boulevard",
      distance: 800,
      coordinates: [40.7834, -73.9612],
      type: "restaurant",
      hasFood: true,
      offers: ["Sustainable menu", "Filtered water station"],
    },
  ]

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          // Fallback to a default location (e.g., New York City)
          setUserLocation({
            latitude: 40.7812,
            longitude: -73.9665,
          })
        },
      )
    }
  }, [])

  // Check if user is near a refill station and needs hydration
  // This would typically be based on time since last drink and location
  useEffect(() => {
    if (userLocation) {
      // Simulate finding a nearby station when user needs hydration
      const timer = setTimeout(() => {
        const needsHydration = Math.random() > 0.5 // Simulate hydration need
        if (needsHydration && !isMapOpen && !isNearbyAlertShown) {
          setIsNearbyAlertShown(true)
        }
      }, 10000) // Check after 10 seconds for demo purposes

      return () => clearTimeout(timer)
    }
  }, [userLocation, isMapOpen, isNearbyAlertShown])

  // Function to get icon based on station type
  const getStationIcon = (type: RefillStation["type"]) => {
    switch (type) {
      case "cafe":
        return <Coffee size={18} />
      case "restaurant":
        return <Utensils size={18} />
      case "gym":
        return <Droplet size={18} />
      default:
        return <Droplet size={18} />
    }
  }

  return (
    <>
      {/* Map Toggle Button */}
      <motion.button
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMapOpen(!isMapOpen)}
        style={{
          background: "rgba(0, 170, 255, 0.3)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(0, 170, 255, 0.5)",
          boxShadow: "0 0 15px rgba(0, 170, 255, 0.5)",
        }}
      >
        <MapPin size={22} className="text-white" style={{ filter: "drop-shadow(0 0 3px rgba(0, 170, 255, 0.8))" }} />
      </motion.button>

      {/* Nearby Station Alert */}
      <AnimatePresence>
        {isNearbyAlertShown && !isMapOpen && (
          <motion.div
            className="fixed bottom-24 left-4 right-16 z-40 p-3 rounded-xl backdrop-blur-md"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            style={{
              background: "rgba(0, 170, 255, 0.2)",
              border: "1px solid rgba(0, 170, 255, 0.4)",
              boxShadow: "0 0 15px rgba(0, 170, 255, 0.3)",
            }}
          >
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                style={{
                  background: "rgba(0, 170, 255, 0.3)",
                  boxShadow: "0 0 10px rgba(0, 170, 255, 0.5)",
                }}
              >
                <Droplet
                  size={20}
                  className="text-white"
                  style={{ filter: "drop-shadow(0 0 3px rgba(0, 170, 255, 0.8))" }}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Refill Station Nearby</h3>
                <p className="text-white/80 text-sm">Green Cafe is 350m away. Time for a hydration break!</p>
              </div>
              <div className="flex gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full bg-white/20"
                  onClick={() => setIsNearbyAlertShown(false)}
                >
                  <X size={16} className="text-white" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full bg-white/20"
                  onClick={() => {
                    setIsMapOpen(true)
                    setIsNearbyAlertShown(false)
                  }}
                >
                  <ChevronRight size={16} className="text-white" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refill Map Panel */}
      <AnimatePresence>
        {isMapOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(5px)",
            }}
          >
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#00AAFF]/30 to-[#00FFFF]/30">
              <h2 className="text-xl font-light text-white" style={{ textShadow: "0 0 10px rgba(0, 170, 255, 0.8)" }}>
                Refill Stations
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20"
                onClick={() => setIsMapOpen(false)}
              >
                <X size={18} className="text-white" />
              </motion.button>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
              <div
                ref={mapRef}
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/placeholder.svg?key=29ejn')",
                }}
              >
                {/* This would be replaced with an actual map component */}
                {/* For now, we'll use a placeholder and simulate the map with markers */}
                {refillStations.map((station) => (
                  <motion.button
                    key={station.id}
                    className="absolute w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      left: `${30 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      background:
                        selectedStation?.id === station.id ? "rgba(0, 255, 170, 0.6)" : "rgba(0, 170, 255, 0.6)",
                      border: "2px solid white",
                      boxShadow: "0 0 15px rgba(0, 170, 255, 0.7)",
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedStation(station)}
                  >
                    {getStationIcon(station.type)}
                  </motion.button>
                ))}

                {/* User location marker */}
                <motion.div
                  className="absolute w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    left: "50%",
                    top: "50%",
                    background: "rgba(0, 255, 255, 0.6)",
                    border: "2px solid white",
                    boxShadow: "0 0 15px rgba(0, 255, 255, 0.7)",
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  <Navigation size={18} className="text-white" />
                </motion.div>
              </div>
            </div>

            {/* Station Details Panel */}
            <AnimatePresence>
              {selectedStation && (
                <motion.div
                  className="p-4 bg-white/10 backdrop-blur-md border-t border-white/20"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                >
                  <div className="flex items-start">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                      style={{
                        background:
                          selectedStation.type === "public" ? "rgba(0, 170, 255, 0.3)" : "rgba(0, 255, 170, 0.3)",
                        boxShadow:
                          selectedStation.type === "public"
                            ? "0 0 10px rgba(0, 170, 255, 0.5)"
                            : "0 0 10px rgba(0, 255, 170, 0.5)",
                      }}
                    >
                      {getStationIcon(selectedStation.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{selectedStation.name}</h3>
                      <p className="text-white/70 text-sm">{selectedStation.address}</p>
                      <p className="text-white/70 text-sm mt-1">
                        {selectedStation.distance}m away • {Math.round(selectedStation.distance / 80)} min walk
                      </p>

                      {selectedStation.hasFood && (
                        <div className="mt-3">
                          <h4 className="text-white/90 text-sm font-medium">Food & Offers</h4>
                          <ul className="mt-1 space-y-1">
                            {selectedStation.offers?.map((offer, index) => (
                              <li key={index} className="text-white/70 text-sm flex items-center">
                                <span className="mr-2">•</span>
                                {offer}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <motion.button
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00FFAA] to-[#00AAFF] text-white text-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ boxShadow: "0 0 10px rgba(0, 255, 170, 0.3)" }}
                        >
                          Directions
                        </motion.button>
                        <motion.button
                          className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          More Info
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
