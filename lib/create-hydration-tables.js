// Script to create the necessary hydration-related tables in Supabase
// Run with: node lib/create-hydration-tables.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  console.error('Please make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('Checking existing tables...')
  
  // Check if hydration_logs table exists
  let { data: hydrationLogs, error: hydrationLogsError } = await supabase
    .from('hydration_logs')
    .select('id')
    .limit(1)
    .maybeSingle()
  
  if (hydrationLogsError && hydrationLogsError.code === '42P01') {
    console.log('Creating hydration_logs table...')
    
    // Create hydration_logs table
    const { error } = await supabase.rpc('create_hydration_logs_table')
    
    if (error) {
      console.error('Error creating hydration_logs table:', error)
    } else {
      console.log('✅ hydration_logs table created successfully')
    }
  } else {
    console.log('✅ hydration_logs table already exists')
  }
  
  // Check if activity_logs table exists
  let { data: activityLogs, error: activityLogsError } = await supabase
    .from('activity_logs')
    .select('id')
    .limit(1)
    .maybeSingle()
  
  if (activityLogsError && activityLogsError.code === '42P01') {
    console.log('Creating activity_logs table...')
    
    // Create activity_logs table
    const { error } = await supabase.rpc('create_activity_logs_table')
    
    if (error) {
      console.error('Error creating activity_logs table:', error)
    } else {
      console.log('✅ activity_logs table created successfully')
    }
  } else {
    console.log('✅ activity_logs table already exists')
  }
  
  // Check if hydration_plans table exists
  let { data: hydrationPlans, error: hydrationPlansError } = await supabase
    .from('hydration_plans')
    .select('id')
    .limit(1)
    .maybeSingle()
  
  if (hydrationPlansError && hydrationPlansError.code === '42P01') {
    console.log('Creating hydration_plans table...')
    
    // Create hydration_plans table
    const { error } = await supabase.rpc('create_hydration_plans_table')
    
    if (error) {
      console.error('Error creating hydration_plans table:', error)
    } else {
      console.log('✅ hydration_plans table created successfully')
    }
  } else {
    console.log('✅ hydration_plans table already exists')
  }
}

// Create PostgreSQL functions to create tables
async function createPgFunctions() {
  console.log('Creating PostgreSQL functions for table creation...')
  
  // Function to create hydration_logs table
  const createHydrationLogsFunc = `
  CREATE OR REPLACE FUNCTION create_hydration_logs_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS hydration_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      input_item_id UUID REFERENCES input_library(id),
      logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      quantity REAL NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    -- Add indexes for common queries
    CREATE INDEX IF NOT EXISTS hydration_logs_user_id_idx ON hydration_logs(user_id);
    CREATE INDEX IF NOT EXISTS hydration_logs_logged_at_idx ON hydration_logs(logged_at);
    
    -- Enable RLS (Row Level Security)
    ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    DROP POLICY IF EXISTS "Users can view their own logs" ON hydration_logs;
    CREATE POLICY "Users can view their own logs" 
      ON hydration_logs 
      FOR SELECT 
      USING (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Users can insert their own logs" ON hydration_logs;
    CREATE POLICY "Users can insert their own logs" 
      ON hydration_logs 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Users can update their own logs" ON hydration_logs;
    CREATE POLICY "Users can update their own logs" 
      ON hydration_logs 
      FOR UPDATE 
      USING (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Users can delete their own logs" ON hydration_logs;
    CREATE POLICY "Users can delete their own logs" 
      ON hydration_logs 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END;
  $$ LANGUAGE plpgsql;
  `
  
  // Function to create activity_logs table
  const createActivityLogsFunc = `
  CREATE OR REPLACE FUNCTION create_activity_logs_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL,
      intensity TEXT NOT NULL DEFAULT 'moderate',
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      outdoor BOOLEAN NOT NULL DEFAULT false,
      temperature_celsius REAL,
      humidity_percent REAL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    -- Add indexes for common queries
    CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS activity_logs_started_at_idx ON activity_logs(started_at);
    
    -- Enable RLS (Row Level Security)
    ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    DROP POLICY IF EXISTS "Users can view their own activities" ON activity_logs;
    CREATE POLICY "Users can view their own activities" 
      ON activity_logs 
      FOR SELECT 
      USING (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Users can insert their own activities" ON activity_logs;
    CREATE POLICY "Users can insert their own activities" 
      ON activity_logs 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Users can update their own activities" ON activity_logs;
    CREATE POLICY "Users can update their own activities" 
      ON activity_logs 
      FOR UPDATE 
      USING (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Users can delete their own activities" ON activity_logs;
    CREATE POLICY "Users can delete their own activities" 
      ON activity_logs 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END;
  $$ LANGUAGE plpgsql;
  `
  
  // Function to create hydration_plans table
  const createHydrationPlansFunc = `
  CREATE OR REPLACE FUNCTION create_hydration_plans_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS hydration_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      input_item_id UUID REFERENCES input_library(id),
      scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      quantity REAL NOT NULL DEFAULT 1,
      fulfilled BOOLEAN NOT NULL DEFAULT false,
      fulfilled_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    -- Add indexes for common queries
    CREATE INDEX IF NOT EXISTS hydration_plans_user_id_idx ON hydration_plans(user_id);
    CREATE INDEX IF NOT EXISTS hydration_plans_scheduled_at_idx ON hydration_plans(scheduled_at);
    
    -- Enable RLS (Row Level Security)
    ALTER TABLE hydration_plans ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    DROP POLICY IF EXISTS "Users can view their own plans" ON hydration_plans;
    CREATE POLICY "Users can view their own plans" 
      ON hydration_plans 
      FOR SELECT 
      USING (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Users can insert their own plans" ON hydration_plans;
    CREATE POLICY "Users can insert their own plans" 
      ON hydration_plans 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Users can update their own plans" ON hydration_plans;
    CREATE POLICY "Users can update their own plans" 
      ON hydration_plans 
      FOR UPDATE 
      USING (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Users can delete their own plans" ON hydration_plans;
    CREATE POLICY "Users can delete their own plans" 
      ON hydration_plans 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END;
  $$ LANGUAGE plpgsql;
  `
  
  // Create each function
  let { error: error1 } = await supabase.rpc('create_hydration_logs_function', {
    sql: createHydrationLogsFunc
  })
  
  if (error1) {
    console.error('Error creating hydration_logs function:', error1)
  } else {
    console.log('✅ create_hydration_logs_table function created')
  }
  
  let { error: error2 } = await supabase.rpc('create_activity_logs_function', {
    sql: createActivityLogsFunc
  })
  
  if (error2) {
    console.error('Error creating activity_logs function:', error2)
  } else {
    console.log('✅ create_activity_logs_table function created')
  }
  
  let { error: error3 } = await supabase.rpc('create_hydration_plans_function', {
    sql: createHydrationPlansFunc
  })
  
  if (error3) {
    console.error('Error creating hydration_plans function:', error3)
  } else {
    console.log('✅ create_hydration_plans_table function created')
  }
}

// Create SQL helper function to execute arbitrary SQL
async function createSqlHelperFunction() {
  console.log('Creating SQL helper function...')
  
  const createFunction = `
  CREATE OR REPLACE FUNCTION execute_sql(sql text)
  RETURNS void AS $$
  BEGIN
    EXECUTE sql;
  END;
  $$ LANGUAGE plpgsql;
  `
  
  const { error } = await supabase.rpc('execute_sql', {
    sql: createFunction
  })
  
  if (error) {
    console.error('Error creating SQL helper function:', error)
    return false
  }
  
  console.log('✅ SQL helper function created')
  return true
}

// Execute direct SQL to create tables
async function createTablesDirectly() {
  console.log('Creating tables directly with SQL...')
  
  // SQL for hydration_logs table
  const hydrationLogsSQL = `
  CREATE TABLE IF NOT EXISTS hydration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    input_item_id UUID REFERENCES input_library(id),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    quantity REAL NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  
  -- Add indexes for common queries
  CREATE INDEX IF NOT EXISTS hydration_logs_user_id_idx ON hydration_logs(user_id);
  CREATE INDEX IF NOT EXISTS hydration_logs_logged_at_idx ON hydration_logs(logged_at);
  
  -- Enable RLS (Row Level Security)
  ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  DROP POLICY IF EXISTS "Users can view their own logs" ON hydration_logs;
  CREATE POLICY "Users can view their own logs" 
    ON hydration_logs 
    FOR SELECT 
    USING (auth.uid() = user_id);
    
  DROP POLICY IF EXISTS "Users can insert their own logs" ON hydration_logs;
  CREATE POLICY "Users can insert their own logs" 
    ON hydration_logs 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
  DROP POLICY IF EXISTS "Users can update their own logs" ON hydration_logs;
  CREATE POLICY "Users can update their own logs" 
    ON hydration_logs 
    FOR UPDATE 
    USING (auth.uid() = user_id);
    
  DROP POLICY IF EXISTS "Users can delete their own logs" ON hydration_logs;
  CREATE POLICY "Users can delete their own logs" 
    ON hydration_logs 
    FOR DELETE 
    USING (auth.uid() = user_id);
  `
  
  // SQL for activity_logs table
  const activityLogsSQL = `
  CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    intensity TEXT NOT NULL DEFAULT 'moderate',
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    outdoor BOOLEAN NOT NULL DEFAULT false,
    temperature_celsius REAL,
    humidity_percent REAL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  
  -- Add indexes for common queries
  CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON activity_logs(user_id);
  CREATE INDEX IF NOT EXISTS activity_logs_started_at_idx ON activity_logs(started_at);
  
  -- Enable RLS (Row Level Security)
  ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  DROP POLICY IF EXISTS "Users can view their own activities" ON activity_logs;
  CREATE POLICY "Users can view their own activities" 
    ON activity_logs 
    FOR SELECT 
    USING (auth.uid() = user_id);
    
  DROP POLICY IF EXISTS "Users can insert their own activities" ON activity_logs;
  CREATE POLICY "Users can insert their own activities" 
    ON activity_logs 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
  DROP POLICY IF EXISTS "Users can update their own activities" ON activity_logs;
  CREATE POLICY "Users can update their own activities" 
    ON activity_logs 
    FOR UPDATE 
    USING (auth.uid() = user_id);
    
  DROP POLICY IF EXISTS "Users can delete their own activities" ON activity_logs;
  CREATE POLICY "Users can delete their own activities" 
    ON activity_logs 
    FOR DELETE 
    USING (auth.uid() = user_id);
  `
  
  // SQL for hydration_plans table
  const hydrationPlansSQL = `
  CREATE TABLE IF NOT EXISTS hydration_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    input_item_id UUID REFERENCES input_library(id),
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    quantity REAL NOT NULL DEFAULT 1,
    fulfilled BOOLEAN NOT NULL DEFAULT false,
    fulfilled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  
  -- Add indexes for common queries
  CREATE INDEX IF NOT EXISTS hydration_plans_user_id_idx ON hydration_plans(user_id);
  CREATE INDEX IF NOT EXISTS hydration_plans_scheduled_at_idx ON hydration_plans(scheduled_at);
  
  -- Enable RLS (Row Level Security)
  ALTER TABLE hydration_plans ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  DROP POLICY IF EXISTS "Users can view their own plans" ON hydration_plans;
  CREATE POLICY "Users can view their own plans" 
    ON hydration_plans 
    FOR SELECT 
    USING (auth.uid() = user_id);
    
  DROP POLICY IF EXISTS "Users can insert their own plans" ON hydration_plans;
  CREATE POLICY "Users can insert their own plans" 
    ON hydration_plans 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
  DROP POLICY IF EXISTS "Users can update their own plans" ON hydration_plans;
  CREATE POLICY "Users can update their own plans" 
    ON hydration_plans 
    FOR UPDATE 
    USING (auth.uid() = user_id);
    
  DROP POLICY IF EXISTS "Users can delete their own plans" ON hydration_plans;
  CREATE POLICY "Users can delete their own plans" 
    ON hydration_plans 
    FOR DELETE 
    USING (auth.uid() = user_id);
  `
  
  // Execute each SQL statement through the SQL API
  const { error: error1 } = await supabase.rpc('execute_sql', { sql: hydrationLogsSQL })
  if (error1) {
    console.error('Error creating hydration_logs table:', error1)
  } else {
    console.log('✅ hydration_logs table created successfully')
  }
  
  const { error: error2 } = await supabase.rpc('execute_sql', { sql: activityLogsSQL })
  if (error2) {
    console.error('Error creating activity_logs table:', error2)
  } else {
    console.log('✅ activity_logs table created successfully')
  }
  
  const { error: error3 } = await supabase.rpc('execute_sql', { sql: hydrationPlansSQL })
  if (error3) {
    console.error('Error creating hydration_plans table:', error3)
  } else {
    console.log('✅ hydration_plans table created successfully')
  }
}

// Main execution
async function main() {
  try {
    console.log('Creating hydration tables in Supabase...')
    
    // First try direct SQL method
    const helperCreated = await createSqlHelperFunction()
    if (helperCreated) {
      await createTablesDirectly()
    } else {
      // Fall back to function creation method
      await createPgFunctions()
      await createTables()
    }
    
    console.log('Done!')
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
