"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Plus, Droplets, Dumbbell, Clock, Target, User, Settings, Loader2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/lib/user-context"
import { HydrationTimeline } from "@/components/hydration-timeline"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  getUserDailyTimeline, 
  calculateUserHydrationGaps
} from "@/lib/hydration-data-functions"
import {
  getUserProfile,
  updateUserProfile
} from "@/lib/client-functions"
import { supabase } from "@/lib/supabase-client"
import { CartProvider, useCart } from "@/components/cart/CartProvider"
import CartModal from "@/components/cart/CartModal"
import ProductGrid from "@/components/products/ProductGrid"
import { getWaterProduct, getProducts, createSimpleRecommendation } from "@/lib/simple-product-functions"

// Body type display mapping with type safety
const BODY_TYPES: Record<string, { name: string }> = {
  // Male body types
  muscular: { name: 'Muscular Build' },
  athletic: { name: 'Athletic Build' },
  stocky: { name: 'Stocky Build' },
  // Female body types
  toned: { name: 'Toned Build' },
  athletic_female: { name: 'Athletic Build' },
  curvy: { name: 'Curvy Build' },
  // Legacy types (for backward compatibility)
  low: { name: 'Low Body Fat' },
  average: { name: 'Average Build' },
  high: { name: 'High Body Fat' },
  // Default type for safety
  default: { name: 'Average Build' }
}

// Type definitions
type BodyType = 'muscular' | 'athletic' | 'stocky' | 'toned' | 'athletic_female' | 'curvy' | 'low' | 'average' | 'high' | 'default';
type HydrationEventType = "water" | "protein" | "electrolyte" | "workout" | "food";

// Safe function to get body type name
function getBodyTypeName(bodyType: string | undefined): string {
  if (!bodyType || !(bodyType in BODY_TYPES)) return BODY_TYPES.default.name;
  return BODY_TYPES[bodyType].name;
}

// UI models
interface HydrationEvent {
  id: string;
  time: string;
  type: HydrationEventType;
  amount?: number;
  description: string;
}

// Get color for event type
function getEventColor(type: string): string {
  switch (type) {
    case "water": return "#00FFFF" // Cyan
    case "protein": return "#FF6B9D" // Pink
    case "electrolyte": return "#9D8DF1" // Purple
    case "workout": return "#FFD166" // Yellow
    case "food": return "#06D6A0" // Green
    default: return "#FFFFFF" // White
  }
}

// Get icon for event type
function getEventIcon(type: string) {
  switch (type) {
    case "water": return <Droplets className="h-4 w-4" />
    case "protein": return <Target className="h-4 w-4" />
    case "electrolyte": return <Dumbbell className="h-4 w-4" />
    case "workout": return <Clock className="h-4 w-4" />
    case "food": return <Target className="h-4 w-4" />
    default: return <Plus className="h-4 w-4" />
  }
}

// Calculate hydration percentage for visualization
function hydrationPercentage(current: number, target: number): number {
  return Math.min(Math.round((current / target) * 100), 100);
}

// Cart Component to wrap everything 
function DashboardWithCart() {
  const cart = useCart()
  
  return (
    <>
      <Dashboard />
      <CartModal 
        isOpen={cart.isCartOpen}
        onClose={cart.closeCart}
        items={cart.items}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onClearCart={cart.clearCart}
      />
    </>
  )
}

// Wrap everything with CartProvider for export
export default function DashboardPage() {
  return (
    <CartProvider>
      <DashboardWithCart />
    </CartProvider>
  )
}

// Main Dashboard Component
function Dashboard() {
  // Product state
  const [products, setProducts] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const { addItem, openCart } = useCart()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { user } = useUser() // Use the UserContext for authentication
  const { toast } = useToast()
  
  // User profile state
  const [userProfile, setUserProfile] = useState<{
    weight: number;
    sex: 'male' | 'female';
    name?: string;
    bodyType?: string;
    doWeightTraining?: boolean;
    doIntenseActivity?: boolean;
  }>({
    weight: 70,
    sex: 'male' as 'male' | 'female',
    bodyType: 'average' as BodyType,
    name: undefined,
  })
  
  // Timeline and events state
  const [events, setEvents] = useState<HydrationEvent[]>([])
  
  // Hydration data state
  const [dailyTarget, setDailyTarget] = useState({
    water_ml: 2500,
    protein_g: 70,
    sodium_mg: 2000,
    potassium_mg: 3500,
  })
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [hydrationGapData, setHydrationGapData] = useState<{
    hydrationGap: number,
    context: string,
    leanBodyMass: number,
    waterLoss: number,
    waterFromFood: number,
    totalWaterInput: number,
    recommendedIntake: number
  } | null>(null)
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [userNickname, setUserNickname] = useState('')
  
  // Session state
  const [sessionConfig, setSessionConfig] = useState({
    wakeUpTime: '07:00', // Default wake-up time: 7 AM
    lookbackHours: 4,     // Default lookback period: 4 hours
    isCreatingSession: false // Loading state for session creation
  })
  
  // Active session state
  const [activeSession, setActiveSession] = useState<{
    id: string;
    startTime: string;
    dayStartTime: string;
    wakeUpTime: string;
  } | null>(null)
  
  // Form state
  const [newEvent, setNewEvent] = useState<{
    time: string; 
    type: HydrationEventType; 
    amount?: number; 
    description: string;
  }>({
    time: new Date().toTimeString().slice(0, 5),
    type: "water",
    amount: 0,
    description: ""
  })
  
  // State for user session
  const [sessionEmail, setSessionEmail] = useState<string>("");
  const [sessionLoading, setSessionLoading] = useState(true);
  
  // State for tracking hydration values
  const [waterIntake, setWaterIntake] = useState(0)
  const [waterRemaining, setWaterRemaining] = useState(0)
  const [proteinIntake, setProteinIntake] = useState(0)
  const [sodiumIntake, setSodiumIntake] = useState(0)
  const [potassiumIntake, setPotassiumIntake] = useState(0)
  
  // Function to calculate lean body mass based on weight, sex, and body type
  const calculateLBM = (profile: any) => {
    const weight = profile.weight || 70; // Default to 70kg if not set
    const sex = profile.sex || 'male';
    const bodyType = profile.bodyType || 'average';
    
    // Body fat percentage based on sex and body type
    let bodyFatPercentage = 0.25; // Default: 25%
    
    if (sex === 'male') {
      switch(bodyType) {
        case 'muscular': bodyFatPercentage = 0.15; break; // 15%
        case 'athletic': bodyFatPercentage = 0.20; break; // 20%
        case 'stocky': bodyFatPercentage = 0.30; break;   // 30%
        default: bodyFatPercentage = 0.25;                // 25%
      }
    } else { // female
      switch(bodyType) {
        case 'toned': bodyFatPercentage = 0.21; break;         // 21%
        case 'athletic_female': bodyFatPercentage = 0.24; break; // 24%
        case 'curvy': bodyFatPercentage = 0.32; break;         // 32%
        default: bodyFatPercentage = 0.27;                    // 27%
      }
    }
    
    // Calculate LBM: weight × (1 - body fat percentage)
    const lbm = weight * (1 - bodyFatPercentage);
    console.log(`LBM calculated: ${lbm}kg (${bodyFatPercentage * 100}% body fat)`);  
    return lbm;
  };

  // Function to calculate hydration targets based on user profile
  const calculateHydrationTargets = (profile: any) => {
    try {
      console.log('Calculating user daily hydration summary:', profile);
      
      const weight = profile.weight || 70; // Default to 70kg if not set
      
      // Calculate LBM and baseline water needs
      const lbm = calculateLBM(profile);
      const waterPerKgOfLBM = 30; // 30ml per kg of lean body mass
      const baseWater = lbm * waterPerKgOfLBM;
      
      // Baseline sodium calculation (24mg/kg of LBM)
      const sodiumRateMgPerKg = 24;
      const baseSodium = lbm * sodiumRateMgPerKg;
      
      // NOTE: Activity-based water and sodium losses will be tracked in the timeline
      // This is just the baseline calculation for now
      
      // For baseline calculation, we don't add activity water/sodium
      // These will be added when activities are logged in the timeline
      const totalWater = baseWater;
      const totalSodium = baseSodium;
      
      // REFERENCE FOR TIMELINE IMPLEMENTATION:
      // High intensity activity (HIIT/hot yoga): +1300ml water, +800mg sodium per hour
      // Moderate activity (gym/swim/normal yoga): +600ml water, +420mg sodium per hour
      
      // Potassium ratio depends on activity type
      let potassiumMultiplier = 3; // Default for moderate or no activity
      if (profile.doIntenseActivity) {
        potassiumMultiplier = 2; // Ratio shifts for heavy sweating activities
      }
      
      const totalPotassium = totalSodium * potassiumMultiplier;
      
      // Protein calculation based on LBM and training intensity
      // Heavy training: 1.8g/kg LBM, Maintenance: 1.3g/kg LBM
      const proteinRatePerKg = profile.doWeightTraining ? 1.8 : 1.3;
      const baseProtein = lbm * proteinRatePerKg;
      
      // Note: Additional water for protein metabolism (4mL/g) will be added
      // when protein intake is logged on the timeline
      
      // Update state with calculated values
      setWaterIntake(0); // Current intake (from timeline data)
      setWaterRemaining(Math.round(totalWater)); // Target
      setProteinIntake(Math.round(baseProtein)); // Target
      setSodiumIntake(Math.round(totalSodium)); // Target
      setPotassiumIntake(Math.round(totalPotassium)); // Target
      
      // Update daily target state for UI display
      setDailyTarget({
        water_ml: Math.round(totalWater),
        protein_g: Math.round(baseProtein),
        sodium_mg: Math.round(totalSodium),
        potassium_mg: Math.round(totalPotassium)
      });
      
      console.log('Hydration targets calculated:', {
        lbm: Math.round(lbm),
        water: Math.round(totalWater),
        protein: Math.round(baseProtein),
        sodium: Math.round(totalSodium),
        potassium: Math.round(totalPotassium)
      });
    } catch (error) {
      console.error('Error calculating hydration targets:', error);
    }
  }

  // Function to create a new hydration session
  const createNewSession = async () => {
    try {
      // Set loading state
      setSessionConfig(prev => ({ ...prev, isCreatingSession: true }));
      
      // Validate user is logged in
      if (!sessionEmail) {
        toast({
          title: "Not logged in",
          description: "Please log in to start a new session.",
          variant: "destructive"
        });
        return;
      }
      
      // Calculate day start time based on wake-up time and lookback hours
      const today = new Date();
      const [hours, minutes] = sessionConfig.wakeUpTime.split(':').map(Number);
      
      // Set wake-up time for today
      const wakeUpTime = new Date(today);
      wakeUpTime.setHours(hours, minutes, 0, 0);
      
      // Calculate day start time (wake-up time minus lookback hours)
      const dayStartTime = new Date(wakeUpTime);
      dayStartTime.setHours(wakeUpTime.getHours() - sessionConfig.lookbackHours);
      
      // Create a new hydration session in the database
      const { data: newSession, error } = await supabase
        .from('hydration_sessions')
        .insert([
          {
            user_id: user?.id,
            start_time: new Date().toISOString(),
            is_active: true,
            day_start_time: dayStartTime.toISOString(),
            wake_up_time: sessionConfig.wakeUpTime
          }
        ])
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create session: ${error.message}`);
      }
      
      console.log('New session created:', newSession);
      
      // Set the active session in state
      setActiveSession({
        id: newSession.id,
        startTime: newSession.start_time,
        dayStartTime: newSession.day_start_time,
        wakeUpTime: newSession.wake_up_time
      });
      
      // Calculate hydration targets based on user profile
      calculateHydrationTargets(userProfile);
      
      // Create a daily target entry linked to this session
      const { error: targetError } = await supabase
        .from('daily_targets')
        .insert([
          {
            user_id: user?.id,
            session_id: newSession.id,
            water_ml: dailyTarget.water_ml,
            protein_g: dailyTarget.protein_g,
            sodium_mg: dailyTarget.sodium_mg,
            potassium_mg: dailyTarget.potassium_mg
          }
        ]);
      
      if (targetError) {
        console.error('Error creating daily target:', targetError);
      }
      
      // Deactivate any previous active sessions
      const { error: updateError } = await supabase
        .from('hydration_sessions')
        .update({ is_active: false })
        .neq('id', newSession.id)
        .eq('user_id', user?.id)
        .eq('is_active', true);
      
      if (updateError) {
        console.error('Error deactivating old sessions:', updateError);
      }
      
      // Save session preferences to user profile for future sessions
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          wake_up_time: sessionConfig.wakeUpTime,
          session_lookback_hours: sessionConfig.lookbackHours
        })
        .eq('id', user?.id);
      
      if (userUpdateError) {
        console.error('Error saving session preferences to profile:', userUpdateError);
      }
      
      // Show success message
      toast({
        title: "Session Started",
        description: `New hydration day started with wake-up time at ${sessionConfig.wakeUpTime}.`,
      });
      
      // Close the modal
      setShowSessionModal(false);
      
      // TODO: Refresh the timeline to show the new session
      
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Session Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create new session",
        variant: "destructive"
      });
    } finally {
      // Reset loading state
      setSessionConfig(prev => ({ ...prev, isCreatingSession: false }));
    }
  };
  
  // Function to handle profile updates
  const handleUpdateProfile = async () => {
    // Prevent multiple simultaneous update attempts
    if (isLoading) {
      console.log('Update already in progress, please wait...');
      return;
    }
    
    try {
      // Show loading state
      setIsLoading(true);
      
      // Create a local copy of the profile to prevent race conditions
      const profileToUpdate = { ...userProfile };
      
      // Save profile to database if user is logged in
      if (sessionEmail) {
        const { error } = await supabase
          .from('users')
          .update({
            weight: profileToUpdate.weight,
            sex: profileToUpdate.sex,
            body_type: profileToUpdate.bodyType,
            do_weight_training: profileToUpdate.doWeightTraining === true,
            do_intense_activity: profileToUpdate.doIntenseActivity === true
          })
          .eq('email', sessionEmail);
          
        if (error) {
          throw new Error(`Database update failed: ${error.message}`);
        }
          
        console.log('Profile updated in database:', profileToUpdate);
      }
      
      // Recalculate hydration targets based on updated profile
      // Wait for this to complete to ensure state is updated
      calculateHydrationTargets(profileToUpdate);
      
      // Close the profile modal
      setShowProfileModal(false);
      
      // Show success toast
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated and hydration targets recalculated."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Ensure loading state is always reset
      setTimeout(() => setIsLoading(false), 500);
    }
  };
  
  // Function to load the user's active hydration session
  const loadActiveSession = async () => {
    if (!user?.id) return;
    
    try {
      // Load user's session preferences (wake-up time and lookback hours)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('wake_up_time, session_lookback_hours')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('Error loading user session preferences:', userError);
      } else if (userData) {
        // Update session config with saved preferences
        setSessionConfig(prev => ({
          ...prev,
          wakeUpTime: userData.wake_up_time || prev.wakeUpTime,
          lookbackHours: userData.session_lookback_hours || prev.lookbackHours
        }));
        console.log('Loaded user session preferences:', userData);
      }
      const { data, error } = await supabase
        .from('hydration_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading active session:', error);
        return;
      }
      
      if (data) {
        console.log('Found active session:', data);
        setActiveSession({
          id: data.id,
          startTime: data.start_time,
          dayStartTime: data.day_start_time,
          wakeUpTime: data.wake_up_time
        });
        
        // Also load the daily targets for this session
        const { data: targetData, error: targetError } = await supabase
          .from('daily_targets')
          .select('*')
          .eq('session_id', data.id)
          .maybeSingle();
        
        if (targetError) {
          console.error('Error loading session targets:', targetError);
          return;
        }
        
        if (targetData) {
          setDailyTarget({
            water_ml: targetData.water_ml,
            protein_g: targetData.protein_g,
            sodium_mg: targetData.sodium_mg,
            potassium_mg: targetData.potassium_mg
          });
        }
      } else {
        console.log('No active session found');
      }
    } catch (error) {
      console.error('Error in loadActiveSession:', error);
    }
  };
  
  // Get session data directly from Supabase (best practice)
  useEffect(() => {
    // Function to get session data and load user profile
    const getSessionData = async () => {
      try {
        setSessionLoading(true);
        // Get the current session from Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (data?.session?.user?.email) {
          // Set the email from the session
          setSessionEmail(data.session.user.email);
          console.log('Session data retrieved successfully:', data.session.user);
          
          // Get metadata from the session when available
          const metadata = data.session.user.user_metadata;
          if (metadata) {
            console.log('User metadata found:', metadata);
            // If body_type exists in metadata, use it
            if (metadata.body_type) {
              console.log('Setting profile from metadata');
              const updatedProfile = {
                bodyType: metadata.body_type as BodyType,
                name: metadata.name || userProfile.name,
                weight: metadata.weight ? parseFloat(metadata.weight) : userProfile.weight,
                sex: metadata.sex || userProfile.sex
              };
              
              setUserProfile(updatedProfile);
              // Calculate hydration targets with session metadata
              calculateHydrationTargets(updatedProfile);
            }
          }
          
          // Directly load user profile with email
          console.log('Loading profile for email:', data.session.user.email);
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', data.session.user.email)
            .single();
            
          console.log('User profile query result:', { profileData, profileError });
          
          if (profileData) {
            // Use exact values from database with minimal processing
            const dbProfile = {
              weight: typeof profileData.weight === 'string' ? parseFloat(profileData.weight) : profileData.weight,
              sex: profileData.sex as 'male' | 'female',
              bodyType: profileData.body_type as BodyType,
              name: profileData.name,
            };
            
            setUserProfile(dbProfile);
            
            console.log('Setting user profile directly from database:', {
              weight: profileData.weight,
              weightType: typeof profileData.weight,
              sex: profileData.sex,
              bodyType: profileData.body_type,
              name: profileData.name
            });
            
            // Calculate hydration targets with database profile
            calculateHydrationTargets(dbProfile);
            
            // Load active session after profile is loaded
            await loadActiveSession();
          } else {
            console.log('No profile found for email, using defaults');
            // Still calculate with whatever profile we have
            calculateHydrationTargets(userProfile);
          }
        } else {
          console.log('No session or user email found', data);
          // Still calculate with default profile
          calculateHydrationTargets(userProfile);
        }
      } catch (error) {
        console.error('Error in getSessionData:', error);
        // Use default profile for calculations if there's an error
        calculateHydrationTargets(userProfile);
      } finally {
        setSessionLoading(false);
      }
    };
    
    // Call the function
    getSessionData();
    
    // Set up auth state change listener (recommended in Supabase docs)
    const { data: authListener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log('Auth state changed:', event);
      if (session?.user?.email) {
        setSessionEmail(session.user.email);
      } else {
        setSessionEmail("");
      }
    });
    
    // Clean up the listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load product data
  useEffect(() => {
    async function loadProductData() {
      try {
        // Get all products
        const allProducts = await getProducts();
        if (allProducts.length > 0) {
          setProducts(allProducts);
          
          // Find a water product for recommendation
          const waterProduct = allProducts.find(p => p.category === 'water');
          if (waterProduct) {
            // Create a simple recommendation
            setRecommendations(createSimpleRecommendation(waterProduct.id));
          }
        }
      } catch (error) {
        console.error('Error loading product data:', error);
      }
    }
    
    loadProductData();
  }, []);
  
  // Handle adding a product to cart
  const handleAddToCart = (product: any) => {
    addItem(product);
    toast({
      title: "Added to cart",
      description: `${product.name} added to your order.`,
    });
  };

  // Load user data on component mount
  useEffect(() => {
    console.log('User data load effect triggered');
    if (!user) {
      console.log('No user, skipping profile load');
      setIsLoading(false);
      return;
    }
    
    async function loadUserData() {      
      console.log('Starting to load user data...');
      setIsLoading(true);
      try {
        // Calculate hydration gap using our hydration-data-functions
        const hydrationGapResult = await calculateUserHydrationGaps(user?.id || '');
        
        if (hydrationGapResult && user?.id) {
          // Direct query to users table with exact email
          console.log('Querying for user with email:', user.email);
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
            
          console.log('User profile query result:', { profile, profileError });
          
          if (profile) {
            // Use exact values from database with minimal processing
            setUserProfile({
              weight: typeof profile.weight === 'string' ? parseFloat(profile.weight) : profile.weight,
              sex: profile.sex as 'male' | 'female',
              bodyType: profile.body_type as BodyType,
              name: profile.name,
            });
            
            console.log('Setting user profile directly from database:', {
              weight: profile.weight,
              weightType: typeof profile.weight,
              sex: profile.sex,
              bodyType: profile.body_type,
              name: profile.name
            });
          }
          
          // Get timeline data using the new function
          const timelineData = await getUserDailyTimeline(user.id);
          if (timelineData && Array.isArray(timelineData)) {
            // Convert timeline items to UI events format
            const eventItems = timelineData
              .filter(item => item.type === 'log' || item.type === 'activity')
              .map(item => ({
                id: item.id,
                time: new Date(item.timestamp).toTimeString().slice(0, 5),
                type: item.item_category === 'drink' ? 'water' : 
                      item.item_category === 'activity' ? 'workout' : 'food',
                amount: item.quantity,
                description: item.item_name
              } as HydrationEvent));
            
            setEvents(eventItems);
          }
          
          // Set hydration gap data for the UI
          const hydrationData = {
            hydrationGap: hydrationGapResult.water_gap_ml,
            context: `Based on your ${hydrationGapResult.summary?.total_activity_minutes || 0} minutes of activity`,
            leanBodyMass: (profile?.weight || 70) * 0.7, // Estimate LBM as 70% of weight
            waterLoss: hydrationGapResult.water_gap_ml,
            waterFromFood: 0, // Not tracked in new system yet
            totalWaterInput: hydrationGapResult.summary?.total_water_ml || 0,
            recommendedIntake: (hydrationGapResult.summary?.total_water_ml || 0) + hydrationGapResult.water_gap_ml
          };
          
          setHydrationGapData(hydrationData);
          
          // Set daily target based on the gap calculation
          setDailyTarget({
            water_ml: hydrationData.recommendedIntake,
            protein_g: 0.8 * userProfile.weight, // 0.8g per kg of body weight
            sodium_mg: hydrationGapResult.sodium_gap_mg + (hydrationGapResult.summary?.total_sodium_mg || 0),
            potassium_mg: hydrationGapResult.potassium_gap_mg + (hydrationGapResult.summary?.total_potassium_mg || 0)
          });
        }
      } catch (error) {
        console.error('Error loading hydration data:', error);
        toast({
          title: "Error loading data",
          description: "There was a problem loading your hydration data."
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserData();
    
    // Setup the canvas animation (water drop effect)
    const setupCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = 60;
      canvas.height = 60;
      
      // Simple water drop animation
      let drops: {x: number, y: number, radius: number, speed: number}[] = [];
      
      const createDrop = () => {
        drops.push({
          x: Math.random() * canvas.width,
          y: 0,
          radius: 1 + Math.random() * 2,
          speed: 1 + Math.random() * 2
        });
      };
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw main water droplet
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#00FFFF';
        ctx.fill();
        
        // Draw ripples
        drops.forEach((drop, index) => {
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 255, 255, ${1 - drop.y / canvas.height})`;
          ctx.fill();
          
          drop.y += drop.speed;
          
          if (drop.y > canvas.height) {
            drops.splice(index, 1);
          }
        });
        
        if (Math.random() < 0.1) createDrop();
        
        requestAnimationFrame(animate);
      };
      
      animate();
    };
    
    setupCanvas();
  }, [user, toast]);
  
  // Function to update user profile
  async function updateProfile() {
    if (!user?.id) return;
    
    try {
      // Show loading toast
      toast({
        title: "Updating profile",
        description: "Saving your profile information..."
      });
      
      // Save profile to Supabase
      const updatedProfile = await updateUserProfile(user?.id || '', {
        weight: userProfile.weight,
        sex: userProfile.sex,
        // Convert the bodyType to a valid type that matches database schema
        body_type: userProfile.bodyType as any
      });
      
      if (updatedProfile) {
        // Close modal and show success toast
        setShowProfileModal(false);
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated."
        });
        
        // Refresh hydration calculations with new profile data
        const hydrationData = await calculateUserHydrationGaps(user.id);
        if (hydrationData) {
          setHydrationGapData({
            hydrationGap: hydrationData.water_gap_ml,
            context: `Based on your ${hydrationData.summary?.total_activity_minutes || 0} minutes of activity`,
            leanBodyMass: userProfile.weight * 0.7,
            waterLoss: hydrationData.water_gap_ml,
            waterFromFood: 0,
            totalWaterInput: hydrationData.summary?.total_water_ml || 0,
            recommendedIntake: (hydrationData.summary?.total_water_ml || 0) + hydrationData.water_gap_ml
          });
          
          setDailyTarget({
            water_ml: ((hydrationData.summary?.total_water_ml || 0) + hydrationData.water_gap_ml),
            protein_g: 0.8 * userProfile.weight,
            sodium_mg: hydrationData.sodium_gap_mg + (hydrationData.summary?.total_sodium_mg || 0),
            potassium_mg: hydrationData.potassium_gap_mg + (hydrationData.summary?.total_potassium_mg || 0)
          });
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "There was a problem saving your profile.",
        variant: "destructive"
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Toaster />

      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-cyan-400/20">
        <div className="flex items-center gap-4">
          <canvas ref={canvasRef} className="w-[60px] h-[60px]" />
          <h1
            className="text-2xl font-light tracking-wider"
            style={{
              color: "#00FFFF",
              textShadow: "0 0 15px #00FFFF",
            }}
          >
            WATER BAR
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm opacity-70 flex items-center gap-2">
            {/* Display greeting using available user data */}
            <span className="mr-4 font-medium" style={{ color: "#00FFFF" }}>
              Hello, {isLoading ? "loading..." : 
                     userProfile.name ? userProfile.name : 
                     sessionEmail ? sessionEmail.split('@')[0] : "USER"}
            </span>
            <span>
              {isLoading ? "loading..." : `${userProfile.weight}kg • ${getBodyTypeName(userProfile.bodyType || 'average')}`}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setShowProfileModal(true)}
            >
              <Settings className="h-4 w-4" style={{ color: "#00FFFF" }} />
            </Button>
          </div>
          {activeSession ? (
            <div className="flex items-center mr-2 p-1.5 pl-3 pr-2 bg-blue-500/10 border border-blue-500/30 rounded-md">
              <div className="flex-1 mr-2">
                {/* Check if session is older than 24 hours */}
                {new Date().getTime() - new Date(activeSession.startTime).getTime() > 24 * 60 * 60 * 1000 ? (
                  <div className="text-xs font-medium text-amber-400">Session (24h+)</div>
                ) : (
                  <div className="text-xs font-medium text-blue-400">Active Session</div>
                )}
                <div className="text-xs text-gray-400">
                  Wake-up: {activeSession.wakeUpTime}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 bg-green-400/20 border border-green-400/60 hover:bg-green-400/30"
                style={{ color: "#4ADE80" }}
                onClick={() => setShowSessionModal(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> New Day
              </Button>
            </div>
          ) : (
            <Button
              className="bg-green-400/20 border border-green-400/60 hover:bg-green-400/30 mr-2"
              style={{ color: "#4ADE80" }}
              onClick={() => setShowSessionModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Start New Day
            </Button>
          )}
          <Button
            className="bg-green-400/20 border border-green-400/60 hover:bg-green-400/30 mr-2"
            style={{ color: "#4ADE80" }}
            onClick={openCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" /> Cart
          </Button>
          <Button
            className="bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30"
            style={{ color: "#00FFFF" }}
            onClick={() => (window.location.href = "/")}
          >
            <User className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Timeline Sidebar */}
        <div className="w-80 h-screen sticky top-0 p-6 border-r border-cyan-400/20 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2
              className="text-xl font-medium"
              style={{
                color: "#00FFFF",
                textShadow: "0 0 10px #00FFFF60",
              }}
            >
              Today's Timeline
            </h2>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30"
                  style={{ color: "#00FFFF" }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-cyan-400/30">
                <DialogHeader>
                  <DialogTitle style={{ color: "#00FFFF" }}>Add Event</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-cyan-400">Time</Label>
                    <Input
                      type="time"
                      className="col-span-3 bg-slate-700 border-cyan-400/30"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-cyan-400">Type</Label>
                    <Select
                      value={newEvent.type}
                      onValueChange={(value) => setNewEvent({ ...newEvent, type: value as HydrationEventType })}
                    >
                      <SelectTrigger className="col-span-3 bg-slate-700 border-cyan-400/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-cyan-400/30">
                        <SelectItem value="water">Water</SelectItem>
                        <SelectItem value="electrolyte">Electrolyte</SelectItem>
                        <SelectItem value="protein">Protein</SelectItem>
                        <SelectItem value="workout">Workout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(newEvent.type === "water" || newEvent.type === "electrolyte" || newEvent.type === "protein") && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right text-cyan-400">Amount</Label>
                      <Input
                        type="number"
                        className="col-span-3 bg-slate-700 border-cyan-400/30"
                        placeholder={newEvent.type === "protein" ? "grams" : "ml"}
                        value={newEvent.amount || ""}
                        onChange={(e) => setNewEvent({ ...newEvent, amount: Number(e.target.value) })}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-cyan-400">Description</Label>
                    <Input
                      className="col-span-3 bg-slate-700 border-cyan-400/30"
                      placeholder="Optional description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  className="bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30"
                  style={{ color: "#00FFFF" }}
                  onClick={() => {
                    // TODO: Add event logic would go here
                    setShowAddModal(false);
                    toast({
                      title: "Event added",
                      description: "Your hydration event has been logged."
                    });
                  }}
                >
                  Add Event
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          {/* HydrationTimeline component - integrates with the user auth */}
          <Card className="bg-slate-800/50 border-slate-600 shadow-inner shadow-cyan-900/10 mb-4">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading timeline...</span>
                </div>
              ) : sessionEmail ? (
                // If we have a session email, we are logged in
                <HydrationTimeline userId={user?.id || 'current'} />
              ) : (
                <div className="flex items-center justify-center p-6 text-red-400">
                  <p>Error: User not logged in. Please log in to view your hydration timeline.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Timeline events */}
          <div className="space-y-4 relative pl-8">
            {events.map((event) => (
              <motion.div
                key={event.id}
                className="relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="absolute -left-8 mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center"
                  style={{
                    backgroundColor: getEventColor(event.type),
                    borderColor: getEventColor(event.type),
                    boxShadow: `0 0 10px ${getEventColor(event.type)}60`,
                  }}
                >
                  {getEventIcon(event.type)}
                </div>
                <div className="mb-1 text-xs opacity-70">{event.time}</div>
                <Card className="p-3 bg-slate-700/50 border-slate-600">
                  <div
                    className="text-sm font-medium"
                    style={{ color: getEventColor(event.type) }}
                  >
                    {event.type === "water"
                      ? `${event.amount}ml Water`
                      : event.type === "protein"
                      ? `${event.amount}g Protein`
                      : event.type === "electrolyte"
                      ? `Electrolyte Drink`
                      : event.type === "workout"
                      ? `Workout`
                      : `Food`}
                  </div>
                  {event.description && (
                    <div className="text-xs opacity-70 mt-1">{event.description}</div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Hydration Gap Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-slate-800/50 border-cyan-400/30 shadow-lg shadow-cyan-900/10">
              <CardHeader className="pb-2">
                <CardTitle
                  className="text-lg font-medium"
                  style={{ color: "#00FFFF", textShadow: "0 0 8px #00FFFF40" }}
                >
                  Daily Hydration Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Water intake today</span>
                      <span>Target</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>{waterIntake}ml</span>
                      <span className="text-cyan-400">{waterRemaining}ml</span>
                    </div>
                    <Progress 
                      value={waterIntake > 0 && waterRemaining > 0 ? (waterIntake / waterRemaining) * 100 : 0} 
                      className="h-2 mt-1 bg-slate-800"
                    />
                    <div className="text-xs text-muted-foreground mt-2">
                      Based on your {userProfile.weight}kg {userProfile.bodyType} build
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-cyan-400/30 shadow-lg shadow-cyan-900/10">
              <CardHeader className="pb-2">
                <CardTitle
                  className="text-lg font-medium"
                  style={{ color: "#00FFFF", textShadow: "0 0 8px #00FFFF40" }}
                >
                  Hydration Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm mb-1">Water</div>
                  <div className="font-bold">{waterRemaining}ml</div>
                  <Progress value={75} className="h-2 mt-1 bg-slate-800" />
                </div>
                <div>
                  <div className="text-sm mb-1">Protein</div>
                  <div className="font-bold">{proteinIntake}g</div>
                  <Progress value={60} className="h-2 mt-1 bg-slate-800" />
                </div>
                <div>
                  <div className="text-sm mb-1">Sodium</div>
                  <div className="font-bold">{sodiumIntake}mg</div>
                  <Progress value={40} className="h-2 mt-1 bg-slate-800" />
                </div>
                <div>
                  <div className="text-sm mb-1">Potassium</div>
                  <div className="font-bold">{potassiumIntake}mg</div>
                  <Progress value={30} className="h-2 mt-1 bg-slate-800" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="bg-slate-800/50 border-blue-400/30 shadow-lg shadow-blue-900/10 mb-6">
            <CardHeader className="pb-2">
              <CardTitle
                className="text-lg font-medium"
                style={{ color: "#9D8DF1", textShadow: "0 0 8px rgba(157, 141, 241, 0.4)" }}
              >
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : userProfile && userProfile.weight > 0 ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium" style={{ color: "#00FFFF" }}>
                        Recommended Products
                      </h3>
                      <div className="text-sm text-slate-400">
                        Based on your {userProfile.weight}kg {userProfile.bodyType} build
                      </div>
                    </div>
                    
                    {/* Product recommendations */}
                    {products.length > 0 ? (
                      <div className="mt-4">
                        <ProductGrid 
                          products={products}
                          recommendations={recommendations}
                          addToCartAction={handleAddToCart}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 p-6 bg-slate-700/50 rounded-md border border-cyan-400/20 text-center">
                        <Loader2 className="h-8 w-8 mx-auto mb-2 text-cyan-400 animate-spin" />
                        <div className="text-sm text-slate-300">
                          Loading recommended products...
                        </div>
                      </div>
                    )}
                    
                    {/* Hydration tracking buttons */}
                    <div className="mt-4">
                      <h3 className="text-base font-medium mb-2" style={{ color: "#9D8DF1" }}>
                        Quick Hydration Tracking
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="border-blue-400/30 justify-start"
                          onClick={() => {
                            setNewEvent({
                              ...newEvent,
                              type: "water",
                              amount: 500,
                              description: "Water"
                            });
                            setShowAddModal(true);
                          }}
                        >
                          <Droplets className="h-4 w-4 mr-2 text-cyan-400" />
                          Add 500ml Water
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="border-blue-400/30 justify-start"
                          onClick={() => {
                            setNewEvent({
                              ...newEvent,
                              type: "electrolyte",
                              amount: 330,
                              description: "Electrolyte Drink"
                            });
                            setShowAddModal(true);
                          }}
                        >
                          <Dumbbell className="h-4 w-4 mr-2 text-purple-400" />
                          Add Electrolyte Drink
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 text-slate-400">
                  No recommendations at this time.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="bg-slate-800 border-cyan-400/30 sm:max-w-[500px] w-[95vw]">
          <DialogHeader>
            <DialogTitle style={{ color: "#00FFFF" }}>Update Profile</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="space-y-2">
              <Label className="text-cyan-400">Biological Sex</Label>
              <div className="grid grid-cols-2 w-full gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setUserProfile({ ...userProfile, sex: 'male' })}
                  className={`py-2 px-1 rounded-md border ${userProfile.sex === 'male' 
                    ? 'bg-blue-400/20 text-blue-300 border-blue-400/40' 
                    : 'bg-slate-700/50 text-slate-300 border-slate-600/40'}`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setUserProfile({ ...userProfile, sex: 'female' })}
                  className={`py-2 px-1 rounded-md border ${userProfile.sex === 'female' 
                    ? 'bg-pink-400/20 text-pink-300 border-pink-400/40' 
                    : 'bg-slate-700/50 text-slate-300 border-slate-600/40'}`}
                >
                  Female
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-400">Body Type</Label>
              {userProfile.sex === 'male' ? (
                <div className="grid grid-cols-3 w-full gap-2 mt-1">
                  {[['muscular', 'Muscular', 'green'], ['athletic', 'Athletic', 'cyan'], ['stocky', 'Stocky', 'pink']].map(([value, label, color]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setUserProfile({ ...userProfile, bodyType: value as BodyType })}
                      className={`py-2 px-1 rounded-md border ${userProfile.bodyType === value 
                        ? `bg-${color}-400/20 text-${color}-300 border-${color}-400/40` 
                        : 'bg-slate-700/50 text-slate-300 border-slate-600/40'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 w-full gap-2 mt-1">
                  {[['toned', 'Toned', 'green'], ['athletic_female', 'Athletic', 'cyan'], ['curvy', 'Curvy', 'pink']].map(([value, label, color]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setUserProfile({ ...userProfile, bodyType: value as BodyType })}
                      className={`py-2 px-1 rounded-md border ${userProfile.bodyType === value 
                        ? `bg-${color}-400/20 text-${color}-300 border-${color}-400/40` 
                        : 'bg-slate-700/50 text-slate-300 border-slate-600/40'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight" className="text-cyan-400">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                className="bg-slate-700/70 border-slate-600 text-slate-100"
                value={userProfile.weight}
                onChange={(e) => setUserProfile({ ...userProfile, weight: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-400 mb-2 block">Activity Profile</Label>
              <div className="space-y-3 pl-1">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="weightTraining"
                    className="h-4 w-4 mr-3 accent-cyan-400"
                    checked={userProfile.doWeightTraining || false}
                    onChange={(e) => {
                      console.log('Weight training checkbox changed to:', e.target.checked);
                      setUserProfile({ ...userProfile, doWeightTraining: e.target.checked });
                    }}
                  />
                  <Label htmlFor="weightTraining" className="text-slate-100 cursor-pointer">
                    Muscle Building / Weight Training
                  </Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="intenseActivity"
                    className="h-4 w-4 mr-3 accent-cyan-400"
                    checked={userProfile.doIntenseActivity || false}
                    onChange={(e) => {
                      console.log('Intense activity checkbox changed to:', e.target.checked);
                      setUserProfile({ ...userProfile, doIntenseActivity: e.target.checked });
                    }}
                  />
                  <Label htmlFor="intenseActivity" className="text-slate-100 cursor-pointer">
                    HIIT / Hot Yoga / Outdoor Training
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={handleUpdateProfile}
            className="bg-cyan-400/20 border border-cyan-400/60 hover:bg-cyan-400/30"
            style={{ color: "#00FFFF" }}
          >
            Save Profile
          </Button>
        </DialogContent>
      </Dialog>

      {/* Start New Session Modal */}
      <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
        <DialogContent className="bg-slate-800 border-green-400/30 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle style={{ color: "#4ADE80" }}>Start New Hydration Day</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wakeUpTime" className="text-green-400">Wake-up Time</Label>
              <Input
                id="wakeUpTime"
                type="time"
                className="bg-slate-700/70 border-slate-600 text-slate-100"
                value={sessionConfig.wakeUpTime}
                onChange={(e) => setSessionConfig({ ...sessionConfig, wakeUpTime: e.target.value })}
              />
              <p className="text-xs text-slate-400">The time you typically wake up each day</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lookbackHours" className="text-green-400">Session Lookback (hours)</Label>
              <Input
                id="lookbackHours"
                type="number"
                min="0"
                max="12"
                className="bg-slate-700/70 border-slate-600 text-slate-100"
                value={sessionConfig.lookbackHours}
                onChange={(e) => setSessionConfig({ ...sessionConfig, lookbackHours: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-400">How many hours before wake-up to include in your day</p>
            </div>

            <div className="bg-slate-700/50 p-3 rounded-md border border-green-400/20">
              <p className="text-sm text-slate-300">
                <strong className="text-green-400">Reminder:</strong> Starting a new day will calculate hydration targets based on your current profile. Make sure your profile is up to date.
              </p>
              <Button
                onClick={() => setShowProfileModal(true)}
                variant="link"
                className="p-0 h-auto mt-1 text-green-400 hover:text-green-300"
              >
                Review Profile Settings
              </Button>
            </div>
          </div>
          <div className="flex justify-between gap-4">
            <Button
              onClick={() => setShowSessionModal(false)}
              variant="ghost"
              className="border border-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={createNewSession}
              className="bg-green-400/20 border border-green-400/60 hover:bg-green-400/30 flex-1"
              style={{ color: "#4ADE80" }}
              disabled={sessionConfig.isCreatingSession}
            >
              {sessionConfig.isCreatingSession ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Start New Day"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
