"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import type { Venue } from "@/types/hydration-types"

interface VenueSuggestionsCardProps {
  venues: Venue[]
  isLoading: boolean
  error: string | null
}

export default function VenueSuggestionsCard({ venues, isLoading, error }: VenueSuggestionsCardProps) {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)

  if (isLoading) {
    return (
      <motion.div
        className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 h-64 flex items-center justify-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={{
          boxShadow: "0 0 15px rgba(0, 170, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="animate-pulse text-blue-500">Loading nearby venues...</div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 h-64 flex items-center justify-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={{
          boxShadow: "0 0 15px rgba(255, 100, 100, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="text-red-500">{error}</div>
      </motion.div>
    )
  }

  if (!venues || venues.length === 0) {
    return (
      <motion.div
        className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 flex items-center justify-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={{
          boxShadow: "0 0 15px rgba(0, 170, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="text-slate-600 p-8 text-center">
          No nearby venues found. We'll notify you when you're near a refill station.
        </div>
      </motion.div>
    )
  }

  // Get venue color based on type
  const getVenueColor = (type: string) => {
    switch (type) {
      case "water":
        return "#00FFFF"
      case "electrolyte":
        return "#00AAFF"
      case "food":
        return "#00FFAA"
      default:
        return "#FFFFFF"
    }
  }

  return (
    <motion.div
      className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 neon-card"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      style={{
        boxShadow: "0 0 15px rgba(0, 170, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)",
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium flex items-center">
          <MapPin
            size={18}
            className="mr-1"
            style={{
              color: "#00AAFF",
              filter: "drop-shadow(0 0 5px rgba(0, 170, 255, 0.8))",
            }}
          />
          <span>Nearby Refill Stations</span>
        </h2>
      </div>

      {/* Map Placeholder - In a real app, this would be an actual map */}
      <div className="h-48 bg-white/20 rounded-xl mb-4 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
          Map view would display here
        </div>

        {/* Venue markers */}
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="absolute w-6 h-6 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{
              left: `${30 + Math.random() * 60}%`,
              top: `${30 + Math.random() * 40}%`,
              background: getVenueColor(venue.type),
              boxShadow: `0 0 10px ${getVenueColor(venue.type)}`,
            }}
            onClick={() => setSelectedVenue(venue)}
          >
            <MapPin size={14} className="text-white" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {venues.map((venue) => (
          <motion.div
            key={venue.id}
            className={`p-3 rounded-xl bg-white/20 border border-white/20 ${
              selectedVenue?.id === venue.id ? "bg-white/40" : ""
            }`}
            whileHover={{
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              boxShadow: `0 0 15px ${getVenueColor(venue.type)}50`,
            }}
            onClick={() => setSelectedVenue(venue)}
            style={{
              borderColor: `${getVenueColor(venue.type)}50`,
              cursor: "pointer",
            }}
          >
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-full mr-3 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${getVenueColor(venue.type)}50, ${getVenueColor(venue.type)}30)`,
                  boxShadow: `0 0 10px ${getVenueColor(venue.type)}50`,
                }}
              >
                <MapPin
                  size={20}
                  className="text-white"
                  style={{ filter: `drop-shadow(0 0 3px ${getVenueColor(venue.type)})` }}
                />
              </div>
              <div className="flex-1">
                <div className="text-slate-800 font-medium">{venue.name}</div>
                <div className="text-sm text-slate-600">{venue.distance}m away</div>
              </div>
              <div
                className="text-sm px-2 py-1 rounded-full"
                style={{
                  background: `${getVenueColor(venue.type)}20`,
                  color: getVenueColor(venue.type),
                }}
              >
                {venue.type}
              </div>
            </div>

            {/* Offer and menu details */}
            {(venue.offer || venue.menu) && (
              <div className="mt-2 pl-13">
                {venue.offer && (
                  <div className="text-sm bg-white/30 rounded-lg p-2 mb-1">
                    <span className="font-medium">Offer: </span>
                    {venue.offer.title}
                    {venue.offer.voucher && (
                      <span className="ml-2 px-2 py-0.5 bg-white/40 rounded-full text-xs">
                        Code: {venue.offer.voucher}
                      </span>
                    )}
                  </div>
                )}
                {venue.menu && (
                  <div className="text-sm bg-white/30 rounded-lg p-2">
                    <span className="font-medium">Try: </span>
                    {venue.menu.item}
                    <span className="ml-2 text-xs text-[#00FFAA]">{venue.menu.meets}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
