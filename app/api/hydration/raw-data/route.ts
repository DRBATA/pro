import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create admin Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
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

  // Get the active session for this user
  const { data: activeSession, error: sessionError } = await supabase
    .from('hydration_sessions')
    .select('id, day_start_time, start_time')
    .eq('user_id', user_id)
    .eq('is_active', true)
    .order('start_time', { ascending: false })
    .limit(1)
    .single();
  
  if (sessionError && sessionError.code !== 'PGRST116') { // Not found is ok
    console.error('[hydration-raw-data] Error fetching active session:', sessionError);
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  // If no active session found, we'll use today's date as fallback
  const sessionId = activeSession?.id;
  const dayStartTime = activeSession?.day_start_time || `${today}T00:00:00Z`;
  const sessionEndTime = `${today}T23:59:59Z`; // End of today as default end time

  console.log(`[hydration-raw-data] Using session: ${sessionId || 'none'} with start time: ${dayStartTime}`);

  try {
    // 1. Get timeline events joined with input_library
    let eventsQuery = supabase
      .from('timeline_events')
      .select(`
        id,
        event_time,
        quantity,
        event_type,
        input_item_id,
        notes,
        session_id,
        response_id,
        input_library (
          id, name, description, category,
          ivf, isf, icf
        )
      `)
      .eq('user_id', user_id)
      .gte('event_time', dayStartTime)
      .lte('event_time', sessionEndTime);
    
    // If we have a session ID, filter by it
    if (sessionId) {
      eventsQuery = eventsQuery.eq('session_id', sessionId);
    }
    
    const { data: timeline_events, error: eventError } = await eventsQuery;
      
    if (eventError) {
      console.error('[hydration-raw-data] Error fetching timeline events:', eventError);
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }
    
    // 2. Get daily hydration targets
    // First try to get targets for the specific session
    let targetQuery = supabase
      .from('daily_targets')
      .select('water_ml, sodium_mg, potassium_mg, protein_g')
      .eq('user_id', user_id);
    
    if (sessionId) {
      // If we have a session, try to get targets for that session
      targetQuery = targetQuery.eq('session_id', sessionId);
    } else {
      // Otherwise, fall back to today's date
      targetQuery = targetQuery.eq('target_date', today);
    }
    
    const { data: targets, error: targetError } = await targetQuery.single();
      
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
