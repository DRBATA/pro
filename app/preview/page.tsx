"use client";

import HydrationDashboard from "@/components/hydration-dashboard";
import { Card } from "@/components/ui/card";

export default function ThemePreview() {
  // Mock user data
  const mockUser = {
    id: "preview-user",
    name: "Azam Bata",
    email: "preview@example.com"
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-riad-emerald neon-text">
        Moroccan Riad Theme Preview
      </h1>
      
      <div className="mb-10">
        <p className="mb-4">
          This page showcases the new Moroccan riad inspired theme with emerald pools, 
          tile patterns, and palm leaf accents.
        </p>
        
        <div className="riad-card palm-leaf-shadow p-4 mb-6">
          <h2 className="text-xl font-medium text-riad-emerald mb-2">
            Theme Features
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Emerald pool-inspired progress indicators</li>
            <li>Moroccan tile borders and patterns</li>
            <li>Palm leaf decorative elements</li>
            <li>Elegant white and emerald color palette</li>
          </ul>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-riad-emerald">
          Hydration Dashboard Component
        </h2>
        <HydrationDashboard user={mockUser} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="riad-pool p-6 flex items-center justify-center">
          <p className="text-white text-xl font-medium">Emerald Pool Element</p>
        </div>
        
        <div className="riad-tile-border p-6">
          <p className="text-xl font-medium text-riad-emerald">Tile Border Element</p>
          <p className="mt-2">This demonstrates the clean white tile borders with emerald accents.</p>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-riad-emerald">
          Palm Leaf SVG Decoration
        </h2>
        <div className="border border-riad-sand p-6 relative">
          <p className="mb-10">The palm leaf SVG should appear in the corner of this box with higher opacity:</p>
          
          {/* Direct SVG embed with higher opacity */}
          <div className="absolute top-0 right-0 w-32 h-32" style={{ opacity: 0.5 }}>
            <svg width="200px" height="200px" viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <path d="M100,0 C120,40 140,60 200,80 C140,90 120,110 100,200 C80,110 60,90 0,80 C60,60 80,40 100,0 Z" 
                    fill="#006C54" opacity="0.7"></path>
                <path d="M100,30 C110,50 120,60 150,70 C120,75 110,85 100,120 C90,85 80,75 50,70 C80,60 90,50 100,30 Z" 
                    fill="#006C54" opacity="0.8"></path>
              </g>
            </svg>
          </div>
          
          <p>Below is a card with the standard CSS palm-leaf-shadow class (opacity 0.1):</p>
          <div className="riad-card palm-leaf-shadow mt-4 p-6">
            <p className="text-xl font-medium text-riad-emerald">Card with Palm Leaf Shadow</p>
            <p className="mt-2">The palm leaf shadow should appear subtly in the top-right corner.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
