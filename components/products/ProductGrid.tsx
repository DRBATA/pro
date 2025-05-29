"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplet, Plus, ShoppingBag } from 'lucide-react'

// Simple product type
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

// Simple recommendation type
type Recommendation = {
  productId: string
  priority: number
  quantity: number
}

interface ProductGridProps {
  products: Product[]
  recommendations?: Recommendation[]
  addToCartAction: (product: Product) => void
}

export default function ProductGrid({
  products,
  recommendations = [],
  addToCartAction,
}: ProductGridProps) {
  // Helper function to check if a product is recommended
  const isRecommended = (productId: string) => {
    return recommendations.some(rec => rec.productId === productId)
  }
  
  // Get recommendation priority (1 is highest)
  const getRecommendationPriority = (productId: string) => {
    const rec = recommendations.find(rec => rec.productId === productId)
    return rec ? rec.priority : 999
  }
  
  // Sort products: recommended first, then by priority
  const sortedProducts = [...products].sort((a, b) => {
    const aIsRecommended = isRecommended(a.id)
    const bIsRecommended = isRecommended(b.id)
    
    if (aIsRecommended && !bIsRecommended) return -1
    if (!aIsRecommended && bIsRecommended) return 1
    
    if (aIsRecommended && bIsRecommended) {
      return getRecommendationPriority(a.id) - getRecommendationPriority(b.id)
    }
    
    return 0
  })
  
  return (
    <div className="space-y-4">      
      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedProducts.map((product) => (
          <Card key={product.id} className={`overflow-hidden ${isRecommended(product.id) ? 'border-cyan-500/50 bg-cyan-900/20' : ''}`}>
            {product.image_url && (
              <div className="aspect-video w-full relative bg-slate-900">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </div>
                {isRecommended(product.id) && (
                  <Badge variant="default" className="bg-cyan-600">Recommended</Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-4 pt-0 space-y-2">
              {product.water_ml && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Droplet className="h-4 w-4" /> {product.water_ml}ml water
                </div>
              )}
              <div className="text-lg font-semibold">
                AED {product.price.toFixed(2)}
              </div>
            </CardContent>
            
            <CardFooter className="p-4 pt-0">
              <Button 
                onClick={() => addToCartAction(product)} 
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Add to Order
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Empty state */}
      {products.length === 0 && (
        <div className="text-center p-8 border border-dashed rounded-lg border-slate-700">
          <ShoppingBag className="h-12 w-12 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">No products available</h3>
          <p className="text-slate-400">
            There are currently no products available.
          </p>
        </div>
      )}
    </div>
  )
}
