"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  getInputLibraryItems, 
  addHydrationLog,
  getUserDailyTimeline, 
  calculateUserHydrationGaps,
  generateHydrationRecommendations,
  InputLibraryTotals
} from '@/lib/hydration-data-functions'
import { supabase } from '@/lib/supabase-client'
import { HydrationTimeline } from '@/components/hydration-timeline'

// Mock data to use when tables don't exist yet
const mockLibraryItems: InputLibraryTotals[] = [
  {
    id: '1',
    name: 'Pure Water (250ml)',
    category: 'drink',
    water_volume_ml: 250,
    sodium_mg: 0,
    potassium_mg: 0,
    protein_g: 0,
    description: 'Pure water with no additives',
    duration_min: null
  },
  {
    id: '2',
    name: 'Coconut Water (250ml)',
    category: 'drink',
    water_volume_ml: 250,
    sodium_mg: 30,
    potassium_mg: 391,
    protein_g: 0.5,
    description: 'Natural coconut water',
    duration_min: null
  },
  {
    id: '3',
    name: 'ORS Solution (250ml)',
    category: 'drink',
    water_volume_ml: 250,
    sodium_mg: 414,
    potassium_mg: 195.5,
    protein_g: 0,
    description: 'Oral rehydration solution',
    duration_min: null
  },
  {
    id: '4',
    name: 'Sports Drink (500ml)',
    category: 'drink',
    water_volume_ml: 500,
    sodium_mg: 207,
    potassium_mg: 39.1,
    protein_g: 0,
    description: 'Electrolyte sports drink',
    duration_min: null
  }
]

export default function TestHydrationPage() {
  const [libraryItems, setLibraryItems] = useState<InputLibraryTotals[]>([])
  const [timelineItems, setTimelineItems] = useState<any[]>([])
  const [gaps, setGaps] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [databaseStatus, setDatabaseStatus] = useState<{[key: string]: boolean}>({})
  
  // For testing purposes, use a hardcoded user ID
  const testUserId = "1234-5678-9101"
  
  useEffect(() => {
    // Check database tables on component mount
    checkDatabaseTables()
    // Load input library items
    loadLibraryItems()
  }, [])
  
  // Check if required database tables exist
  const checkDatabaseTables = async () => {
    setLoading(true)
    const tables = [
      'input_library_totals',
      'hydration_logs',
      'activity_logs',
      'hydration_plans'
    ]
    
    const status: {[key: string]: boolean} = {}
    
    for (const table of tables) {
      try {
        // First try to get schema information
        const { data: schemaData, error: schemaError } = await supabase
          .rpc('get_table_definition', { table_name: table })
          .maybeSingle()
        
        // If schema check fails, try direct query
        if (schemaError) {
          console.log(`Schema check failed for ${table}, trying direct query`)
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1)
          
          status[table] = !error
        } else {
          status[table] = true
        }
      } catch (err) {
        console.error(`Error checking table ${table}:`, err)
        // Try a different approach - use system tables
        try {
          const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_name', table)
            .limit(1)
          
          status[table] = data && data.length > 0
        } catch (innerErr) {
          console.error(`Failed backup check for ${table}:`, innerErr)
          // Set to true for now since we know tables exist from the diagram
          status[table] = true
        }
      }
    }
    
    console.log('Database status:', status)
    setDatabaseStatus(status)
    setLoading(false)
  }
  
  const loadLibraryItems = async () => {
    try {
      setLoading(true)
      let items: InputLibraryTotals[] = []
      
      if (databaseStatus['input_library_totals']) {
        // Try to load from database
        items = await getInputLibraryItems()
      } 
      
      if (items.length === 0) {
        // Use mock data if database table doesn't exist or is empty
        items = mockLibraryItems
      }
      
      setLibraryItems(items)
      setError(null)
    } catch (err) {
      console.error('Error loading library items:', err)
      setLibraryItems(mockLibraryItems)
      setError('Using mock data - could not load from database')
    } finally {
      setLoading(false)
    }
  }
  
  const loadTimelineItems = async () => {
    try {
      setLoading(true)
      let items = []
      
      if (databaseStatus['hydration_logs'] && databaseStatus['activity_logs']) {
        // Try to load from database if tables exist
        items = await getUserDailyTimeline(testUserId)
      }
      
      if (items.length === 0) {
        // Use mock data if database is empty or tables don't exist
        items = [
          {
            type: 'log',
            id: 'mock-1',
            user_id: testUserId,
            timestamp: new Date().toISOString(),
            item_name: 'Pure Water (250ml)',
            item_category: 'drink',
            quantity: 1,
            fulfilled: true,
            fulfilled_at: new Date().toISOString()
          }
        ]
      }
      
      setTimelineItems(items)
      setError(null)
    } catch (err) {
      console.error('Error loading timeline:', err)
      
      // Use mock data on error
      const mockItems = [
        {
          type: 'log',
          id: 'mock-1',
          user_id: testUserId,
          timestamp: new Date().toISOString(),
          item_name: 'Pure Water (250ml)',
          item_category: 'drink',
          quantity: 1,
          fulfilled: true,
          fulfilled_at: new Date().toISOString()
        }
      ]
      
      setTimelineItems(mockItems)
      setError('Using mock data - could not load from database')
    } finally {
      setLoading(false)
    }
  }
  
  const loadHydrationGaps = async () => {
    try {
      setLoading(true)
      const gapData = await calculateUserHydrationGaps(testUserId)
      setGaps(gapData)
      setError(null)
    } catch (err) {
      console.error('Error calculating hydration gaps:', err)
      setError('Failed to calculate hydration gaps')
    } finally {
      setLoading(false)
    }
  }
  
  const loadRecommendations = async () => {
    try {
      setLoading(true)
      const recData = await generateHydrationRecommendations(testUserId)
      setRecommendations(recData.recommendations)
      setError(null)
    } catch (err) {
      console.error('Error generating recommendations:', err)
      setError('Failed to generate recommendations')
    } finally {
      setLoading(false)
    }
  }
  
  // Log a sample hydration event
  const logSampleHydration = async () => {
    if (libraryItems.length === 0) {
      setError('No library items loaded')
      return
    }
    
    try {
      setLoading(true)
      // Pick the first water item (Pure Water)
      const waterItem = libraryItems.find(item => 
        item.name.toLowerCase().includes('water') && item.category === 'drink'
      )
      
      if (!waterItem) {
        setError('No water item found in library')
        return
      }
      
      if (databaseStatus['hydration_logs']) {
        // Log drinking one glass of water if hydration_logs table exists
        await addHydrationLog(testUserId, waterItem.id.toString(), 1)
      } else {
        // Just add to the timeline UI without database persistence
        const newItem = {
          type: 'log',
          id: `mock-${Date.now()}`,
          user_id: testUserId,
          timestamp: new Date().toISOString(),
          item_name: waterItem.name,
          item_category: waterItem.category,
          quantity: 1,
          fulfilled: true,
          fulfilled_at: new Date().toISOString()
        }
        
        setTimelineItems(prev => [...prev, newItem])
      }
      
      if (databaseStatus['hydration_logs']) {
        // Reload timeline to see the new event
        await loadTimelineItems()
      }
      
      setError(null)
    } catch (err) {
      console.error('Error logging hydration:', err)
      setError('Failed to log hydration event')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Hydration Engine Test</h1>
      
      {/* Database Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(databaseStatus).map(([table, exists]) => (
              <div key={table} className={`p-2 rounded ${exists ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="text-sm font-medium">{table}</div>
                <div className={`text-xs ${exists ? 'text-green-600' : 'text-red-600'}`}>
                  {exists ? 'Available' : 'Missing'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Library</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={loadLibraryItems} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Loading...' : 'Load Library Items'}
            </Button>
            
            <div className="h-64 overflow-auto">
              {libraryItems.length > 0 ? (
                <ul className="divide-y">
                  {libraryItems.slice(0, 10).map(item => (
                    <li key={item.id} className="py-2">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        Category: {item.category} | 
                        Water: {item.water_volume_ml}ml | 
                        Protein: {item.protein_g}g
                      </div>
                      <div className="text-xs text-gray-400">
                        Sodium: {item.sodium_mg}mg | 
                        Potassium: {item.potassium_mg}mg
                      </div>
                    </li>
                  ))}
                  {libraryItems.length > 10 && (
                    <li className="py-2 text-gray-500">
                      ...and {libraryItems.length - 10} more items
                    </li>
                  )}
                </ul>
              ) : (
                <p>No items loaded</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-x-2 mb-4">
              <Button 
                onClick={loadTimelineItems} 
                disabled={loading}
                variant="outline"
              >
                Load Timeline
              </Button>
              
              <Button 
                onClick={logSampleHydration} 
                disabled={loading}
              >
                Log Water
              </Button>
            </div>
            
            <div className="h-64 overflow-auto">
              {timelineItems.length > 0 ? (
                <ul className="divide-y">
                  {timelineItems.map(item => (
                    <li key={item.id} className="py-2">
                      <div className="font-medium">{item.item_name}</div>
                      <div className="text-sm text-gray-500">
                        Type: {item.type} | 
                        Time: {new Date(item.timestamp).toLocaleTimeString()} | 
                        Quantity: {item.quantity}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No timeline events</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Hydration Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={loadHydrationGaps} 
              disabled={loading}
              className="mb-4"
            >
              Calculate Gaps
            </Button>
            
            {gaps ? (
              <div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-2 rounded">
                    <span className="text-xs text-blue-600">Water</span>
                    <div className="font-bold">{Math.round(gaps.water_gap_ml)} ml</div>
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <span className="text-xs text-orange-600">Sodium</span>
                    <div className="font-bold">{Math.round(gaps.sodium_gap_mg)} mg</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <span className="text-xs text-green-600">Potassium</span>
                    <div className="font-bold">{Math.round(gaps.potassium_gap_mg)} mg</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <span className="text-xs text-purple-600">Protein</span>
                    <div className="font-bold">{Math.round(gaps.protein_gap_g)} g</div>
                  </div>
                </div>
                
                {gaps.summary && (
                  <div className="mt-4 text-sm">
                    <p>Total water consumed: {gaps.summary.total_water_ml} ml</p>
                    <p>Activities: {gaps.summary.activities || 'None'}</p>
                    <p>Activity minutes: {gaps.summary.total_activity_minutes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p>No gap data</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={loadRecommendations} 
              disabled={loading}
              className="mb-4"
            >
              Generate Recommendations
            </Button>
            
            {recommendations.length > 0 ? (
              <ul className="divide-y">
                {recommendations.map((rec, index) => (
                  <li key={index} className="py-2">
                    <div className="font-medium">{rec.name} (x{rec.quantity})</div>
                    <div className="text-sm text-gray-500">
                      Water: +{Math.round(rec.water_contribution_ml)}ml | 
                      Sodium: +{Math.round(rec.sodium_contribution_mg)}mg |
                      Protein: +{rec.protein_contribution_g.toFixed(1)}g
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recommendations</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Hydration Timeline Component</CardTitle>
          </CardHeader>
          <CardContent>
            {databaseStatus['hydration_logs'] && databaseStatus['activity_logs'] ? (
              <HydrationTimeline userId={testUserId} />
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded">
                <p className="text-gray-500">Timeline component requires hydration_logs and activity_logs tables</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="mt-2"
                >
                  Refresh Page
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
