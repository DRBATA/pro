"use client"

import { supabase } from './lib/supabase-client'

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    // If no error, the table exists
    return !error
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error)
    return false
  }
}

async function checkDatabaseStructure() {
  const requiredTables = [
    'users',
    'hydration_events',
    'daily_targets',
    'hydration_kits',
    'orders',
    'user_credits',
    'credit_transactions',
    'input_library',
    'hydration_plans',
    'hydration_logs',
    'activity_logs'
  ]
  
  const requiredViews = [
    'input_library_totals',
    'daily_timeline',
    'daily_hydration_summary'
  ]
  
  console.log('Checking database structure...')
  
  // Check tables
  for (const table of requiredTables) {
    const exists = await checkTableExists(table)
    console.log(`Table ${table}: ${exists ? 'EXISTS' : 'MISSING'}`)
  }
  
  // Check views
  for (const view of requiredViews) {
    const exists = await checkTableExists(view)
    console.log(`View ${view}: ${exists ? 'EXISTS' : 'MISSING'}`)
  }
  
  console.log('Database structure check complete')
}

// Export function to be used in a React component
export { checkDatabaseStructure }

// When running this file directly
if (typeof window !== 'undefined') {
  console.log('Starting database structure check...')
  checkDatabaseStructure()
    .then(() => console.log('Check completed'))
    .catch(err => console.error('Error running check:', err))
}
