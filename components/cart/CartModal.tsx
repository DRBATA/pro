"use client"

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { useToast } from "@/components/ui/use-toast"

// Simple types for cart functionality
type Product = {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  category: string
  water_ml?: number
  sodium_mg?: number
  potassium_mg?: number
}

type CartItem = {
  product: Product
  quantity: number
}

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (index: number, newQuantity: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
}

export default function CartModal({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CartModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { toast } = useToast()
  
  // Calculate total price
  const totalPrice = items.reduce((total, item) => {
    return total + (item.product.price * item.quantity)
  }, 0)
  
  // Handle checkout process
  const handleCheckout = async () => {
    if (items.length === 0) return
    
    setIsProcessing(true)
    
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        toast({
          title: "Not logged in",
          description: "Please log in to complete your order",
          variant: "destructive"
        })
        setIsProcessing(false)
        return
      }
      
      // Create order record
      const orderData = {
        user_id: session.user.id,
        total_amount: totalPrice,
        status: 'pending',
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        }))
      }
      
      const { error } = await supabase
        .from('orders')
        .insert(orderData)
      
      if (error) {
        throw error
      }
      
      // Order successful
      setIsComplete(true)
      toast({
        title: "Order placed successfully",
        description: `Your order total: AED ${totalPrice.toFixed(2)}`,
        variant: "default"
      })
      
      // Reset after a delay
      setTimeout(() => {
        setIsComplete(false)
        setIsProcessing(false)
        onClearCart()
        onClose()
      }, 3000)
    } catch (error) {
      console.error('Checkout error:', error)
      toast({
        title: "Checkout failed",
        description: "There was an error processing your order",
        variant: "destructive"
      })
      setIsProcessing(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Order</DialogTitle>
          <DialogDescription>
            Review your order before checkout
          </DialogDescription>
        </DialogHeader>
        
        {/* Success message */}
        {isComplete ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h3 className="text-xl font-medium">Order Complete!</h3>
            <p className="text-center text-slate-400">
              Your order has been placed successfully.
              Please pick up your order at the Water Bar.
            </p>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div className="max-h-[50vh] overflow-y-auto space-y-4 my-4">
              {items.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm font-medium mt-1">
                        AED {item.product.price.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-6 text-center">{item.quantity}</span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400"
                        onClick={() => onRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Order summary */}
            {items.length > 0 && (
              <div className="pt-4 border-t border-slate-700">
                <div className="flex justify-between font-medium text-lg mb-4">
                  <span>Total</span>
                  <span>AED {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleCheckout} disabled={items.length === 0 || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Checkout</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
