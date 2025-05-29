"use client"

import { useState, useEffect } from 'react'
import { format, startOfToday, addDays, subDays, isToday, parseISO } from 'date-fns'
import { 
  Calendar, 
  Clock, 
  Droplet, 
  PlusCircle, 
  Activity,
  Check,
  Plus,
  Coffee,
  Utensils
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from './ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from './ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Slider } from './ui/slider'
import { Switch } from './ui/switch'

import {
  getUserTimelineEvents,
  getInputLibraryItems,
  addTimelineEvent,
  getActiveHydrationSession,
  InputLibraryItem,
  TimelineEvent
} from '../lib/hydration-data-functions'

interface HydrationTimelineProps {
  userId: string
}

export function HydrationTimeline({ userId }: HydrationTimelineProps) {
  const [selectedDate, setSelectedDate] = useState(startOfToday())
  const [timelineItems, setTimelineItems] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [libraryItems, setLibraryItems] = useState<InputLibraryItem[]>([])
  const [activeSession, setActiveSession] = useState<{ id: string, start_time: string } | null>(null)
  
  // For adding new hydration log
  const [selectedItemId, setSelectedItemId] = useState<string | number>('')
  const [quantity, setQuantity] = useState(1)
  
  // For adding new activity
  const [activityType, setActivityType] = useState('walking')
  const [activityIntensity, setActivityIntensity] = useState('moderate')
  const [activityDuration, setActivityDuration] = useState(30)
  const [activityOutdoor, setActivityOutdoor] = useState(false)
  const [activityTemperature, setActivityTemperature] = useState<number | undefined>(undefined)
  
  useEffect(() => {
    loadTimelineData()
    loadLibraryItems()
    loadActiveSession()
  }, [userId, selectedDate])
  
  const loadActiveSession = async () => {
    try {
      const session = await getActiveHydrationSession(userId)
      setActiveSession(session)
    } catch (error) {
      console.error('Failed to load active session:', error)
    }
  }
  
  const loadTimelineData = async () => {
    setLoading(true)
    try {
      const items = await getUserTimelineEvents(userId, selectedDate)
      setTimelineItems(items)
    } catch (error) {
      console.error('Failed to load timeline data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadLibraryItems = async () => {
    try {
      const items = await getInputLibraryItems()
      setLibraryItems(items)
    } catch (error) {
      console.error('Failed to load library items:', error)
    }
  }
  
  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1))
  }
  
  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1))
  }
  
  const handleToday = () => {
    setSelectedDate(startOfToday())
  }
  
  const handleAddHydration = async () => {
    if (!selectedItemId || !activeSession) {
      console.error('Cannot add hydration event: No selected item or no active session')
      return
    }
    
    try {
      // Get the selected item to determine if it's food or drink
      const selectedItem = libraryItems.find(item => item.id === selectedItemId)
      if (!selectedItem) {
        console.error('Selected item not found in library')
        return
      }
      
      // Add the event to the timeline
      await addTimelineEvent(
        userId,
        activeSession.id,
        selectedItem.category as 'food' | 'drink', // Category from the library item
        selectedItemId.toString(),
        quantity,
        undefined, // No duration for food/drink
        new Date() // Current time
      )
      
      setAddDialogOpen(false)
      await loadTimelineData()
      
      // Reset form
      setSelectedItemId('')
      setQuantity(1)
    } catch (error) {
      console.error('Failed to add hydration event:', error)
    }
  }
  
  const handleAddActivity = async () => {
    if (!activeSession) {
      console.error('Cannot add activity event: No active session')
      return
    }
    
    try {
      // Add the activity event to the timeline
      await addTimelineEvent(
        userId,
        activeSession.id,
        'activity',
        undefined, // No input item for activity
        1, // Quantity is always 1 for activities
        activityDuration,
        new Date(),
        activityOutdoor ? activityTemperature : undefined,
        undefined, // No humidity data
        activityType + ' - ' + activityIntensity // Store activity details in notes
      )
      
      setAddDialogOpen(false)
      await loadTimelineData()
      
      // Reset form
      setActivityType('walking')
      setActivityIntensity('moderate')
      setActivityDuration(30)
      setActivityOutdoor(false)
      setActivityTemperature(undefined)
    } catch (error) {
      console.error('Failed to add activity event:', error)
    }
  }
  
  const getIconForItem = (item: TimelineEvent) => {
    if (item.event_type === 'activity') {
      return <Activity className="h-4 w-4" />
    }
    
    if (item.event_type === 'drink') {
      return <Coffee className="h-4 w-4" />
    }
    
    if (item.event_type === 'food') {
      return <Utensils className="h-4 w-4" />
    }
    
    return <Droplet className="h-4 w-4" />
  }
  
  return (
    <div className="space-y-4">
      {/* Removed the navigation buttons with arrows since we're only showing today */}
      <div className="flex items-center justify-between">
        <span className="font-medium">
          Timeline for Today
        </span>
        
        {/* Keeping the dialog for adding events */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add to Timeline</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="hydration">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hydration">Hydration</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="hydration" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="item">Select Item</Label>
                    <Select 
                      value={selectedItemId.toString()} 
                      onValueChange={(value) => setSelectedItemId(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select an item</SelectItem>
                        {libraryItems
                          .filter(item => item.category === 'drink' || item.category === 'food')
                          .map(item => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      >
                        -
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setQuantity(prev => prev + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleAddHydration}>Add</Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="activityType">Activity Type</Label>
                    <Select 
                      value={activityType} 
                      onValueChange={setActivityType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walking">Walking</SelectItem>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="cycling">Cycling</SelectItem>
                        <SelectItem value="swimming">Swimming</SelectItem>
                        <SelectItem value="weight_training">Weight Training</SelectItem>
                        <SelectItem value="yoga">Yoga</SelectItem>
                        <SelectItem value="team_sports">Team Sports</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="activityIntensity">Intensity</Label>
                    <Select 
                      value={activityIntensity} 
                      onValueChange={setActivityIntensity}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select intensity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="very_high">Very High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="activityDuration">Duration (minutes)</Label>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActivityDuration(prev => Math.max(5, prev - 5))}
                      >
                        -
                      </Button>
                      <Input
                        id="activityDuration"
                        type="number"
                        min={5}
                        value={activityDuration}
                        onChange={(e) => setActivityDuration(parseInt(e.target.value) || 30)}
                        className="w-20 text-center"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActivityDuration(prev => prev + 5)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="activityOutdoor">Outdoor Activity</Label>
                    <Switch 
                      id="activityOutdoor" 
                      checked={activityOutdoor}
                      onCheckedChange={setActivityOutdoor}
                    />
                  </div>
                  
                  {activityOutdoor && (
                    <div>
                      <Label htmlFor="activityTemperature">Temperature (°C)</Label>
                      <Input
                        id="activityTemperature"
                        type="number"
                        value={activityTemperature || ''}
                        onChange={(e) => setActivityTemperature(parseInt(e.target.value) || undefined)}
                        placeholder="Optional"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleAddActivity}>Add</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="py-10 text-center">
          <div className="animate-pulse">Loading timeline...</div>
        </div>
      ) : timelineItems.length === 0 ? (
        <div className="py-10 text-center border rounded-lg">
          <p className="text-muted-foreground">No events for this day</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setAddDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4 mr-1" /> Add Event
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {timelineItems.map((item) => {
              // Get input library item name if available
              const libraryItem = item.input_item_id ? 
                libraryItems.find(lib => lib.id === item.input_item_id) : null;
                
              const displayName = libraryItem ? libraryItem.name : 
                (item.notes || item.event_type);
                
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start p-3 rounded-lg border border-cyan-400/40 bg-slate-700/70"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/30 mr-3">
                    {getIconForItem(item)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className="font-medium text-sm text-white">{displayName}</p>
                    </div>
                    
                    <div className="flex items-center text-xs text-cyan-300 mt-1">
                      <Clock className="h-3 w-3 mr-1 text-cyan-300" />
                      {format(parseISO(item.event_time), 'h:mm a')}
                      
                      {item.event_type === 'activity' ? (
                        <span className="ml-2 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                          <Activity className="h-3 w-3 inline mr-1 text-cyan-300" />
                          {item.duration_minutes} min
                        </span>
                      ) : (
                        <span className="ml-2 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                          <Droplet className="h-3 w-3 inline mr-1 text-cyan-300" />
                          {item.quantity}x
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
