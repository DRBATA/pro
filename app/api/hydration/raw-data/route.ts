import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase client with service role for admin access to the database
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This endpoint returns all timeline events with input library data plus daily targets
export async function GET(req: Request) {
  console.log('[hydration-raw-data] API called');
  
  // Parse user_id from query params
  const url = new URL(req.url);
  const user_id = url.searchParams.get('user_id');
  
  if (!user_id) {
    console.error('[hydration-raw-data] Missing user_id parameter');
    return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 });
  }
  
  // Get today's date in ISO format (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  console.log(`[hydration-raw-data] Fetching data for user ${user_id} on ${today}`);

  try {
    // 1. Get timeline events joined with input_library
    const { data: timeline_events, error: eventError } = await supabase
      .from('timeline_events')
      .select(`
        id,
        event_time,
        quantity,
        event_type,
        input_item_id,
        notes,
        response_id,
        input_library (
          id, name, description, category,
          ivf, isf, icf
        )
      `)
      .eq('user_id', user_id)
      .gte('event_time', `${today}T00:00:00Z`)
      .lte('event_time', `${today}T23:59:59Z`);
      
    if (eventError) {
      console.error('[hydration-raw-data] Error fetching timeline events:', eventError);
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }
    
    // 2. Get daily hydration targets
    const { data: targets, error: targetError } = await supabase
      .from('daily_targets')
      .select('water_ml, sodium_mg, potassium_mg, protein_g')
      .eq('user_id', user_id)
      .eq('target_date', today)
      .single();
      
    if (targetError && targetError.code !== 'PGRST116') { // Not found is ok, we'll use defaults
      console.error('[hydration-raw-data] Error fetching daily targets:', targetError);
      return NextResponse.json({ error: targetError.message }, { status: 500 });
    }
    
    // 3. If no targets found, use default values based on average adult needs
    const hydrationTargets = targets || {
      water_ml: 2500,       // Default 2.5L per day
      sodium_mg: 2300,      // Default sodium RDA
      potassium_mg: 3500,   // Default potassium RDA
      protein_g: 50         // Default protein
    };
    
    console.log(`[hydration-raw-data] Found ${timeline_events.length} timeline events and targets`);
    
    // 4. Return combined data
    return NextResponse.json({
      timeline_events,
      targets: hydrationTargets
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('[hydration-raw-data] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
