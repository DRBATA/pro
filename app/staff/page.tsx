"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Users, Clock, MapPin, Search, User, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getOrders, getHydrationKits, updateOrderStatus } from "@/lib/database-functions"
import { Order as DBOrder, HydrationKit as DBKit } from "@/lib/types/database.types"

// Frontend Order type for UI state management
interface Order {
  id: string
  userId: string
  userName: string
  kitName: string
  status: "pending" | "in-progress" | "completed"
  timestamp: string
  location: string
}

// Frontend Kit type for UI state management
interface Kit {
  id: string
  name: string
  description: string
  archetype: string
  ingredients: string[]
}

// Convert database order to frontend format
function convertDBOrderToUI(dbOrder: DBOrder): Order {
  return {
    id: dbOrder.id,
    userId: dbOrder.user_id,
    userName: "Customer", // We would normally fetch this from the user table
    kitName: dbOrder.kit_id, // This would be the kit name, not ID in a real app
    status: dbOrder.status as "pending" | "in-progress" | "completed",
    timestamp: dbOrder.ordered_at || new Date().toISOString(),
    location: dbOrder.location || "Not specified",
  }
}

// Convert database kit to frontend format
function convertDBKitToUI(dbKit: DBKit): Kit {
  return {
    id: dbKit.id,
    name: dbKit.name,
    description: dbKit.description || "",
    archetype: dbKit.archetype,
    ingredients: dbKit.ingredients ? Object.keys(dbKit.ingredients) : [],
  }
}

export default function StaffDashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("pending")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)
      
      try {
        // Load orders
        const dbOrders = await getOrders()
        if (dbOrders && dbOrders.length > 0) {
          setOrders(dbOrders.map(convertDBOrderToUI))
        } else {
          // If no orders, use empty array
          setOrders([])
        }
        
        // Load hydration kits
        const dbKits = await getHydrationKits()
        if (dbKits && dbKits.length > 0) {
          setKits(dbKits.map(convertDBKitToUI))
        } else {
          // If no kits found, use fallback kits
          setKits([
            {
              id: "1",
              name: "White Ember",
              description: "Post-workout recovery with electrolytes and minerals",
              archetype: "post_sweat_cool",
              ingredients: ["Filtered Water", "Himalayan Salt", "Potassium", "Magnesium", "Zinc", "Lemon Extract"],
            },
            {
              id: "2",
              name: "Silver Mirage",
              description: "Mental clarity and focus enhancement",
              archetype: "mental_fog",
              ingredients: ["Filtered Water", "L-Theanine", "Lion's Mane Extract", "Rhodiola", "Mint", "Ginger"],
            },
          ])
        }
      } catch (err) {
        console.error("Error loading staff data:", err)
        setError("Failed to load data. Please try again.")
        toast({
          title: "Error loading data",
          description: "Please check your connection and try again",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  // Neon triangle animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 100
    canvas.height = 100

    let hue = 300 // Pink/purple hue for staff
    let time = 0

    const drawNeonEffects = () => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const size = 40

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
      gradient.addColorStop(1, `hsla(${hue + 60}, 100%, 80%, 0.9)`)

      ctx.strokeStyle = gradient
      ctx.lineWidth = 2
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.8)`
      ctx.shadowBlur = 20
      ctx.stroke()

      // Draw floating particles
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time
        const distance = 50 + Math.sin(time * 2 + i) * 10
        const x = centerX + Math.cos(angle) * distance
        const y = centerY + Math.sin(angle) * distance

        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${(hue + i * 10) % 360}, 100%, 80%, ${0.4 + Math.sin(time + i) * 0.2})`
        ctx.shadowColor = `hsla(${(hue + i * 10) % 360}, 100%, 70%, 0.8)`
        ctx.shadowBlur = 10
        ctx.fill()
      }

      hue = (hue + 0.5) % 360
      time += 0.02
      requestAnimationFrame(drawNeonEffects)
    }

    drawNeonEffects()
  }, [])

  const handleUpdateOrderStatus = async (orderId: string, newStatus: "pending" | "in-progress" | "completed") => {
    try {
      // Update in database
      const updatedOrder = await updateOrderStatus(orderId, newStatus)
      
      if (updatedOrder) {
        // Update local state
        const updatedOrders = orders.map((order) => {
          if (order.id === orderId) {
            return { ...order, status: newStatus }
          }
          return order
        })

        setOrders(updatedOrders)

        toast({
          title: `Order ${newStatus}`,
          description: `Order #${orderId.slice(0, 5)} has been updated to ${newStatus}`,
        })
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Update failed",
        description: "Could not update the order status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.kitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab = selectedTab === "all" || order.status === selectedTab

    return matchesSearch && matchesTab
  })

  const getKitByName = (name: string) => {
    return kits.find((kit) => kit.name === name) || null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Toaster />

      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-pink-400/20">
        <div className="flex items-center gap-4">
          <canvas ref={canvasRef} className="w-[60px] h-[60px]" />
          <div>
            <h1
              className="text-2xl font-light tracking-wider"
              style={{
                color: "#FF6B9D",
                textShadow: "0 0 15px #FF6B9D",
              }}
            >
              WATER BAR
            </h1>
            <p className="text-sm opacity-70">Staff Dashboard</p>
          </div>
        </div>
        <Button
          className="bg-pink-400/20 border border-pink-400/60 hover:bg-pink-400/30"
          style={{ color: "#FF6B9D" }}
          onClick={() => (window.location.href = "/")}
        >
          <User className="h-4 w-4 mr-2" /> Logout
        </Button>
      </header>

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10 bg-slate-800 border-pink-400/20"
                placeholder="Search orders by name, kit, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-4 w-full md:w-[400px] bg-slate-800">
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-yellow-400/20 data-[state=active]:text-yellow-300"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger
                value="in-progress"
                className="data-[state=active]:bg-blue-400/20 data-[state=active]:text-blue-300"
              >
                In Progress
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-green-400/20 data-[state=active]:text-green-300"
              >
                Completed
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-pink-400/20 data-[state=active]:text-pink-300">
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map((order) => {
            const kit = getKitByName(order.kitName)

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-slate-800 border-pink-400/20 overflow-hidden">
                  <div
                    className="h-1"
                    style={{
                      background:
                        order.status === "pending"
                          ? "linear-gradient(to right, #F9A825, #FFD54F)"
                          : order.status === "in-progress"
                            ? "linear-gradient(to right, #29B6F6, #4FC3F7)"
                            : "linear-gradient(to right, #66BB6A, #81C784)",
                    }}
                  ></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {order.kitName}{" "}
                          <Badge
                            className={
                              order.status === "pending"
                                ? "bg-yellow-400/20 text-yellow-300 hover:bg-yellow-400/30"
                                : order.status === "in-progress"
                                  ? "bg-blue-400/20 text-blue-300 hover:bg-blue-400/30"
                                  : "bg-green-400/20 text-green-300 hover:bg-green-400/30"
                            }
                          >
                            {order.status}
                          </Badge>
                        </CardTitle>
                        <div className="text-sm opacity-70 mt-1">Order #{order.id}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs opacity-70">
                        <Clock className="h-3 w-3" />
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-1">Customer</div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-6 w-6 rounded-full bg-pink-400/30 flex items-center justify-center">
                            <Users className="h-3 w-3" style={{ color: "#FF6B9D" }} />
                          </div>
                          {order.userName}
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-2">
                          <div className="h-6 w-6 rounded-full bg-pink-400/30 flex items-center justify-center">
                            <MapPin className="h-3 w-3" style={{ color: "#FF6B9D" }} />
                          </div>
                          {order.location}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-1">Kit Details</div>
                        {kit && (
                          <div className="text-xs space-y-1">
                            <div className="opacity-70">{kit.description}</div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {kit.ingredients.map((ingredient, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 rounded-full bg-pink-400/10 text-pink-300 text-xs"
                                >
                                  {ingredient}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <div className="flex space-x-2 mt-2">
                        <Button
                          size="sm"
                          variant={order.status === "pending" ? "secondary" : "outline"}
                          className={order.status === "pending" ? "bg-purple-600 hover:bg-purple-700" : ""}
                          onClick={() => handleUpdateOrderStatus(order.id, "pending")}
                        >
                          Pending
                        </Button>
                        <Button
                          size="sm"
                          variant={order.status === "in-progress" ? "secondary" : "outline"}
                          className={order.status === "in-progress" ? "bg-blue-600 hover:bg-blue-700" : ""}
                          onClick={() => handleUpdateOrderStatus(order.id, "in-progress")}
                        >
                          In Progress
                        </Button>
                        <Button
                          size="sm"
                          variant={order.status === "completed" ? "secondary" : "outline"}
                          className={order.status === "completed" ? "bg-green-600 hover:bg-green-700" : ""}
                          onClick={() => handleUpdateOrderStatus(order.id, "completed")}
                        >
                          Completed
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-pink-400 mb-2">No orders found</div>
            <p className="text-sm opacity-70">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
