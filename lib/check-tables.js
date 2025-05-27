// Simple script to check if the required tables exist in Supabase
import { supabase } from './supabase-client';

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ Table ${tableName} doesn't exist or access denied:`, error.message);
      return false;
    } else {
      console.log(`✅ Table ${tableName} exists`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error checking table ${tableName}:`, error.message);
    return false;
  }
}

async function checkTables() {
  console.log('Checking Supabase tables...');
  
  // Existing tables
  const existingTables = [
    'users',
    'hydration_events',
    'daily_targets',
    'hydration_kits',
    'orders'
  ];
  
  // New tables needed for refactored engine
  const newTables = [
    'input_library',
    'hydration_plans',
    'hydration_logs',
    'activity_logs'
  ];
  
  // Views
  const views = [
    'input_library_totals',
    'daily_timeline',
    'daily_hydration_summary'
  ];
  
  console.log('\n--- Checking existing tables ---');
  for (const table of existingTables) {
    await checkTable(table);
  }
  
  console.log('\n--- Checking new tables for refactored engine ---');
  for (const table of newTables) {
    await checkTable(table);
  }
  
  console.log('\n--- Checking views ---');
  for (const view of views) {
    await checkTable(view);
  }
  
  console.log('\nCheck complete!');
}

// Run the check
checkTables()
  .catch(error => {
    console.error('Error running check:', error);
  });
