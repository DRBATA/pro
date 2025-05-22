// Database Schema for Supabase
// Use this to create your tables with Supabase AI

export const DATABASE_SCHEMA = `
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  weight DECIMAL(5,2) NOT NULL, -- kg with 2 decimal places
  body_type TEXT NOT NULL CHECK (body_type IN ('muscular', 'average', 'stocky')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hydration events table
CREATE TABLE hydration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_time TIME NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('water', 'electrolyte', 'protein', 'workout')),
  amount_ml INTEGER, -- for water/electrolyte intake
  amount_g INTEGER, -- for protein intake
  pre_weight DECIMAL(5,2), -- for workouts
  post_weight DECIMAL(5,2), -- for workouts
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily targets table (calculated based on user profile)
CREATE TABLE daily_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_ml INTEGER NOT NULL,
  protein_g INTEGER NOT NULL,
  sodium_mg INTEGER NOT NULL,
  potassium_mg INTEGER NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, target_date)
);

-- Hydration kits table (for staff recommendations)
CREATE TABLE hydration_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  ritual_steps TEXT[], -- array of ritual steps
  ingredients JSONB, -- flexible ingredient list
  archetype TEXT, -- post_sweat_cool, mental_fog, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table (for staff fulfillment)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  kit_id UUID REFERENCES hydration_kits(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  location TEXT,
  notes TEXT,
  ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_hydration_events_user_date ON hydration_events(user_id, event_date);
CREATE INDEX idx_daily_targets_user_date ON daily_targets(user_id, target_date);
CREATE INDEX idx_orders_status ON orders(status);

-- Functions for calculating daily needs
CREATE OR REPLACE FUNCTION calculate_daily_needs(user_weight DECIMAL, body_type TEXT)
RETURNS TABLE(water_ml INTEGER, protein_g INTEGER, sodium_mg INTEGER, potassium_mg INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  multiplier DECIMAL;
  adjusted_weight DECIMAL;
BEGIN
  -- Set multiplier based on body type
  CASE body_type
    WHEN 'muscular' THEN multiplier := 1.1;
    WHEN 'average' THEN multiplier := 1.0;
    WHEN 'stocky' THEN multiplier := 0.9;
    ELSE multiplier := 1.0;
  END CASE;
  
  adjusted_weight := user_weight * multiplier;
  
  RETURN QUERY SELECT
    (adjusted_weight * 35)::INTEGER, -- 35ml per kg
    (adjusted_weight * 1.2)::INTEGER, -- 1.2g per kg
    (adjusted_weight * 20)::INTEGER, -- 20mg per kg
    (adjusted_weight * 40)::INTEGER; -- 40mg per kg
END;
$$;

-- Trigger to update daily targets when user profile changes
CREATE OR REPLACE FUNCTION update_daily_targets()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  targets RECORD;
BEGIN
  -- Calculate new targets
  SELECT * INTO targets FROM calculate_daily_needs(NEW.weight, NEW.body_type);
  
  -- Insert or update daily targets for today
  INSERT INTO daily_targets (user_id, target_date, water_ml, protein_g, sodium_mg, potassium_mg)
  VALUES (NEW.id, CURRENT_DATE, targets.water_ml, targets.protein_g, targets.sodium_mg, targets.potassium_mg)
  ON CONFLICT (user_id, target_date)
  DO UPDATE SET
    water_ml = targets.water_ml,
    protein_g = targets.protein_g,
    sodium_mg = targets.sodium_mg,
    potassium_mg = targets.potassium_mg,
    calculated_at = NOW();
    
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_daily_targets
  AFTER INSERT OR UPDATE OF weight, body_type ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_targets();
`

// TypeScript types that match the database schema
export interface User {
  id: string
  email: string
  name?: string
  weight: number
  body_type: "muscular" | "average" | "stocky"
  created_at: string
  updated_at: string
}

export interface HydrationEvent {
  id: string
  user_id: string
  event_date: string
  event_time: string
  event_type: "water" | "electrolyte" | "protein" | "workout"
  amount_ml?: number
  amount_g?: number
  pre_weight?: number
  post_weight?: number
  description?: string
  created_at: string
}

export interface DailyTargets {
  id: string
  user_id: string
  target_date: string
  water_ml: number
  protein_g: number
  sodium_mg: number
  potassium_mg: number
  calculated_at: string
}

export interface HydrationKit {
  id: string
  name: string
  description?: string
  ritual_steps: string[]
  ingredients: Record<string, any>
  archetype?: string
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  kit_id: string
  status: "pending" | "in-progress" | "completed"
  location?: string
  notes?: string
  ordered_at: string
  completed_at?: string
}
