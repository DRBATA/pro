"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock orders data
const mockOrders = [
  {
    id: "ORD-001",
    user: "Emma Wilson",
    kit: "White Ember",
    status: "pending",
    time: "10:30 AM",
    location: "Room 3",
  },
  {
    id: "ORD-002",
    user: "James Miller",
    kit: "Silver Mirage",
    status: "in-progress",
    time: "11:15 AM",
    location: "Room 1",
  },
  {
    id: "ORD-003",
    user: "Sophia Chen",
    kit: "Night Signal",
    status: "completed",
    time: "09:45 AM",
    location: "Room 2",
  },
]

// Mock kit rituals
const kitRituals = {
  "White Ember": [
    "Apply cool stone to back of neck",
    "Offer electrolyte-infused water at 55°F",
    "Perform gentle wrist rotation technique",
    "Finish with deep breathing exercise",
  ],
  "Silver Mirage": [
    "Start with temple and face ritual",
    "Offer kombucha clarity blend",
    "Perform eye relief technique",
    "Finish with mental reset breathing",
  ],
  "Night Signal": [
    "Begin with chest stone placement",
    "Offer chaga wind-down blend",
    "Perform calming ritual sequence",
    "End with sleep preparation breathing",
  ],
}

export default function StaffDashboard() {
  const [orders, setOrders] = useState(mockOrders)
  const [selectedKit, setSelectedKit] = useState(null)

  const updateOrderStatus = (id, status) => {
    setOrders(orders.map((order) => (order.id === id ? { ...order, status } : order)))
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Incoming Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Kit</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.user}</TableCell>
                  <TableCell>
                    <Button variant="link" className="p-0 h-auto" onClick={() => setSelectedKit(order.kit)}>
                      {order.kit}
                    </Button>
                  </TableCell>
                  <TableCell>{order.time}</TableCell>
                  <TableCell>{order.location}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, "in-progress")}
                        disabled={order.status === "in-progress" || order.status === "completed"}
                      >
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, "completed")}
                        disabled={order.status === "completed"}
                      >
                        Complete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedKit && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedKit} - Ritual Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2">
              {kitRituals[selectedKit].map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <Button className="mt-4" variant="outline" onClick={() => setSelectedKit(null)}>
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
