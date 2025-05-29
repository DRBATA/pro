"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

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

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product) => void
  updateQuantity: (index: number, quantity: number) => void
  removeItem: (index: number) => void
  clearCart: () => void
  itemCount: number
  totalPrice: number
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  
  // Add an item to the cart
  const addItem = (product: Product) => {
    // Check if this product already exists in cart
    const existingIndex = items.findIndex(
      item => item.product.id === product.id
    )
    
    if (existingIndex >= 0) {
      // Update quantity if it exists
      updateQuantity(existingIndex, items[existingIndex].quantity + 1)
    } else {
      // Add new item if it doesn't exist
      setItems([...items, { product, quantity: 1 }])
    }
    
    // Open cart when adding items
    setIsCartOpen(true)
  }
  
  // Update quantity of an item
  const updateQuantity = (index: number, quantity: number) => {
    const newItems = [...items]
    newItems[index].quantity = quantity
    setItems(newItems)
  }
  
  // Remove an item from the cart
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }
  
  // Clear the entire cart
  const clearCart = () => {
    setItems([])
  }
  
  // Calculate total number of items
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
  
  // Calculate total price
  const totalPrice = items.reduce((total, item) => {
    return total + (item.product.price * item.quantity)
  }, 0)
  
  // Open and close cart
  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)
  
  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        totalPrice,
        isCartOpen,
        openCart,
        closeCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Hook to use the cart context
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
