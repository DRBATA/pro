"use client"

import { useState, useEffect } from "react"
import { Plus, CreditCard, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getUserCredits, addCredits } from "@/lib/credit-functions"

interface CreditsDisplayProps {
  userId: string
}

export function CreditsDisplay({ userId }: CreditsDisplayProps) {
  const [credits, setCredits] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [showAddCreditsDialog, setShowAddCreditsDialog] = useState<boolean>(false)
  const [purchaseAmount, setPurchaseAmount] = useState<number>(10)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchCredits() {
      setIsLoading(true)
      const balance = await getUserCredits(userId)
      setCredits(balance)
      setIsLoading(false)
    }

    if (userId) {
      fetchCredits()
    }
  }, [userId])

  async function handleAddCredits() {
    setIsProcessing(true)
    
    try {
      // For demo purposes, we'll just add the credits without actual payment processing
      const result = await addCredits(userId, purchaseAmount, 'purchase', `Added ${purchaseAmount} credits`)
      
      if (result.success) {
        setCredits(result.newBalance)
        setShowAddCreditsDialog(false)
        toast({
          title: "Credits Added",
          description: `Successfully added ${purchaseAmount} credits to your account.`,
          variant: "default"
        })
      } else {
        toast({
          title: "Failed to Add Credits",
          description: result.error || "An error occurred while adding credits.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error adding credits:", error)
      toast({
        title: "Error",
        description: "Failed to add credits. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/10">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" /> 
            Water Bar Credits
          </span>
          <Dialog open={showAddCreditsDialog} onOpenChange={setShowAddCreditsDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8">
                <Plus className="h-4 w-4 mr-1" /> Add Credits
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Credits</DialogTitle>
                <DialogDescription>
                  Purchase credits to spend on hydration kits and drinks.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount
                  </Label>
                  <Select 
                    value={purchaseAmount.toString()} 
                    onValueChange={(value) => setPurchaseAmount(parseInt(value))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Credits ($5)</SelectItem>
                      <SelectItem value="10">10 Credits ($10)</SelectItem>
                      <SelectItem value="20">20 Credits ($20)</SelectItem>
                      <SelectItem value="50">50 Credits ($50)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setShowAddCreditsDialog(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleAddCredits} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Add Credits"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Use your credits to claim hydration kits and drinks.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold mb-1 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary opacity-70" />
              {isLoading ? "..." : credits}
            </div>
            <p className="text-sm text-muted-foreground">Available Credits</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/50 px-6 py-3 text-xs">
        <p>1 credit = $1 value. Credits can be used at any partner venue.</p>
      </CardFooter>
    </Card>
  )
}
