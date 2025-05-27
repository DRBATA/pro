"use client"

import { useState } from "react"
import { Check, AlertCircle, Droplet, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { HydrationKit } from "@/lib/types/database.types"
import { useCredits } from "@/hooks/use-credits"
import { logHydrationEvent } from "@/lib/database-functions"
import { Badge } from "@/components/ui/badge"

interface KitRecommendationProps {
  userId: string
  kit: HydrationKit
  deficit: {
    water: number
    electrolytes: number
    protein: number
  }
  onClaim: () => void
}

export function KitRecommendation({ userId, kit, deficit, onClaim }: KitRecommendationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { credits, useCredits } = useCredits(userId)
  const { toast } = useToast()
  
  // For demo purposes, set a fixed credit cost
  const creditCost = 5
  
  // In a real implementation, we'd calculate how well this kit addresses the deficit
  // For now, we'll use a placeholder calculation
  const matchScore = calculateMatchScore(kit, deficit)
  
  async function handleClaim() {
    if (credits < creditCost) {
      toast({
        title: "Insufficient Credits",
        description: "You don't have enough credits to claim this kit. Add more credits to continue.",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      // Use credits
      const result = await useCredits(creditCost, kit.id, `Claimed ${kit.name} hydration kit`)
      
      if (result.success) {
        // Log as a hydration event
        const event = {
          user_id: userId,
          event_date: new Date().toISOString().split('T')[0],
          event_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event_type: 'electrolyte', // Assuming most kits are primarily electrolyte-based
          amount: 500, // Default amount in ml
          description: `${kit.name} hydration kit`,
        }
        
        await logHydrationEvent(event)
        
        toast({
          title: "Kit Claimed",
          description: `You've successfully claimed the ${kit.name} kit.`,
          variant: "default"
        })
        
        // Notify parent component
        onClaim()
      } else {
        toast({
          title: "Failed to Claim Kit",
          description: result.error || "An error occurred while claiming the kit.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error claiming kit:", error)
      toast({
        title: "Error",
        description: "Failed to claim the kit. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card className={`overflow-hidden border-l-4 ${matchScore > 80 ? 'border-l-green-500' : matchScore > 50 ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{kit.name}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{kit.description}</p>
                {kit.ritual_steps && (
                  <div className="mt-2">
                    <p className="font-semibold text-xs">Ritual:</p>
                    <ul className="text-xs list-disc pl-4 mt-1">
                      {kit.ritual_steps.slice(0, 2).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                      {kit.ritual_steps.length > 2 && <li>+ {kit.ritual_steps.length - 2} more steps</li>}
                    </ul>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-xs mt-1">
          {kit.archetype && (
            <Badge variant="outline" className="mr-2 text-xs">
              {formatArchetype(kit.archetype)}
            </Badge>
          )}
          Recommended based on your hydration gap
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <div className="flex items-center text-sm gap-4">
          <div className="flex items-center">
            <Droplet className="h-3 w-3 mr-1 text-blue-500" />
            <span>Water: 500ml</span>
          </div>
          <div className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-amber-500 mr-1" />
            <span>Electrolytes</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/20 p-3 flex justify-between items-center">
        <div className="text-sm font-medium">
          {creditCost} credits
        </div>
        <Button 
          onClick={handleClaim} 
          disabled={isLoading || credits < creditCost}
          size="sm"
          className={credits < creditCost ? 'opacity-70' : ''}
        >
          {isLoading ? "Processing..." : credits < creditCost ? "Add Credits" : "Claim"}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Helper function to calculate how well this kit matches the user's needs
function calculateMatchScore(kit: HydrationKit, deficit: { water: number, electrolytes: number, protein: number }): number {
  // This is a placeholder calculation that would be refined in production
  // Based on kit ingredients and user's specific needs
  
  // For demo purposes
  if (kit.archetype === 'post_sweat_cool' && deficit.electrolytes > 200) {
    return 90
  } else if (kit.archetype === 'mental_fog' && deficit.water > 800) {
    return 85
  } else if (kit.archetype === 'clean_energy' && deficit.protein > 20) {
    return 80
  }
  
  return 60 // Default medium match
}

// Format archetype for display
function formatArchetype(archetype: string): string {
  return archetype
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
