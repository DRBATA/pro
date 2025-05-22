"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Star, Plus, Minus, Check } from "lucide-react"
import { mockProducts } from "@/lib/mock-data"
import type { Product } from "@/lib/types"
import Image from "next/image"

interface ShopPageProps {
  user: any
}

export default function ShopPage({ user }: ShopPageProps) {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [cart, setCart] = useState<{ id: string; quantity: number }[]>([])

  // Add to cart
  const addToCart = (productId: string) => {
    const existingItem = cart.find((item) => item.id === productId)

    if (existingItem) {
      setCart(cart.map((item) => (item.id === productId ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCart([...cart, { id: productId, quantity: 1 }])
    }
  }

  // Remove from cart
  const removeFromCart = (productId: string) => {
    const existingItem = cart.find((item) => item.id === productId)

    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item)))
    } else {
      setCart(cart.filter((item) => item.id !== productId))
    }
  }

  // Get cart quantity for a product
  const getCartQuantity = (productId: string) => {
    const item = cart.find((item) => item.id === productId)
    return item ? item.quantity : 0
  }

  // Calculate total price
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const product = products.find((p) => p.id === item.id)
      return total + (product ? product.price * item.quantity : 0)
    }, 0)
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Water Bar Shop</CardTitle>
              <CardDescription>Premium hydration products for your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="relative h-48 w-full">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      {product.tag && <Badge className="absolute top-2 right-2 bg-blue-500">{product.tag}</Badge>}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{product.name}</h3>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm ml-1">{product.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.description}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="font-bold">${product.price.toFixed(2)}</div>

                        {getCartQuantity(product.id) > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeFromCart(product.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span>{getCartQuantity(product.id)}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => addToCart(product.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="default" size="sm" onClick={() => addToCart(product.id)}>
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Cart</CardTitle>
              <CardDescription>
                {cart.length === 0
                  ? "Your cart is empty"
                  : `${cart.reduce((total, item) => total + item.quantity, 0)} items in your cart`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Add some products to your cart</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const product = products.find((p) => p.id === item.id)
                    if (!product) return null

                    return (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded-md overflow-hidden">
                            <Image
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ${product.price.toFixed(2)} x {item.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="font-medium">${(product.price * item.quantity).toFixed(2)}</div>
                      </div>
                    )
                  })}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled={cart.length === 0}>
                Checkout
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Never run out of hydration products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h3 className="font-medium text-blue-700 dark:text-blue-300">Water Bar Premium</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Get monthly delivery of your favorite hydration products and save 15%.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Free delivery</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>15% discount on all products</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Personalized hydration plan</span>
                  </li>
                </ul>
                <Button className="w-full mt-4">Subscribe Now</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
