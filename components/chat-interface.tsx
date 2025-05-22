"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, Send, ChevronUp, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { HydrationEvent } from "@/lib/types"

interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  action?: {
    type: string
    data: any
  } | null
}

interface ChatInterfaceProps {
  onAddEvent: (event: HydrationEvent) => void
}

export default function ChatInterface({ onAddEvent }: ChatInterfaceProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi there! I'm your hydration assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isChatOpen])

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen) {
      inputRef.current?.focus()
    }
  }, [isChatOpen])

  // Handle sending a message
  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newUserMessage])
    setInputValue("")

    // Process the message and generate a response
    processUserMessage(inputValue)
  }

  // Process user message and generate appropriate response
  const processUserMessage = (message: string) => {
    const lowerMessage = message.toLowerCase()

    // Simulate AI response with different actions based on keywords
    setTimeout(() => {
      let responseContent = ""
      let action = null

      if (lowerMessage.includes("water") || lowerMessage.includes("drink")) {
        responseContent = "I've added 250ml of water to your hydration log."
        action = {
          type: "add_water",
          data: {
            type: "water",
            name: "Water",
            amount: 250,
            time: new Date().toISOString(),
          },
        }
      } else if (lowerMessage.includes("coffee") || lowerMessage.includes("tea")) {
        responseContent =
          "I've added a coffee to your log. Remember that caffeinated drinks can contribute to hydration but may have a mild diuretic effect."
        action = {
          type: "add_drink",
          data: {
            type: "drink",
            name: "Coffee",
            amount: 330,
            time: new Date().toISOString(),
          },
        }
      } else if (
        lowerMessage.includes("run") ||
        lowerMessage.includes("exercise") ||
        lowerMessage.includes("workout")
      ) {
        responseContent =
          "I've logged your workout. Remember to increase your water intake to compensate for fluid loss during exercise."
        action = {
          type: "add_activity",
          data: {
            type: "activity",
            name: "Workout",
            amount: 0,
            time: new Date().toISOString(),
            details: { duration: 30, intensity: "medium" },
          },
        }
      } else {
        responseContent =
          "How else can I help with your hydration today? You can ask me to log water, drinks, or activities."
      }

      const newAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        sender: "assistant",
        timestamp: new Date(),
        action,
      }

      setMessages((prev) => [...prev, newAssistantMessage])

      // Execute action if present
      if (action && action.type.startsWith("add_")) {
        onAddEvent(action.data)
      }
    }, 1000)
  }

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  // Simulate voice recording
  const handleVoiceRecord = () => {
    setIsRecording(!isRecording)

    if (!isRecording) {
      // Start recording simulation
      setTimeout(() => {
        setIsRecording(false)
        setInputValue("I just drank some water")
      }, 2000)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      <AnimatePresence>
        <motion.div
          className="w-full rounded-t-2xl flex flex-col overflow-hidden relative"
          animate={{
            height: isChatOpen ? "50vh" : "70px",
          }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.3)",
          }}
          className="dark:bg-slate-800/90 dark:border-slate-700/50"
        >
          {/* Chat header - always visible */}
          <div
            className="p-3 flex justify-between items-center cursor-pointer"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400">Hydration Assistant</h3>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsChatOpen(!isChatOpen)
                }}
              >
                {isChatOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </Button>
            </div>
          </div>

          {/* Messages container - only visible when expanded */}
          {isChatOpen && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
                  <div className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        message.sender === "user"
                          ? "bg-blue-500 text-white rounded-tr-none"
                          : "bg-gray-100 dark:bg-slate-700 rounded-tl-none"
                      }`}
                    >
                      <p className={message.sender === "user" ? "text-white" : "text-gray-800 dark:text-gray-200"}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input area - only visible when expanded */}
          {isChatOpen && (
            <div className="p-3 flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700">
              <Input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your hydration..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleVoiceRecord}
                className={isRecording ? "bg-red-100 text-red-500 animate-pulse" : ""}
              >
                <Mic size={18} />
              </Button>
              <Button variant="default" size="icon" onClick={handleSendMessage} disabled={!inputValue.trim()}>
                <Send size={18} />
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
