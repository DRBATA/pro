import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create admin Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// This endpoint returns all timeline events with input library data plus daily targets
export async function GET(req: Request) {
  console.log('HYDRATION_DEBUG: [hydration-raw-data] API called');
  
  // Parse user_id from query params
  const url = new URL(req.url);
  const user_id = url.searchParams.get('user_id');
  const requestId = `req_${Date.now()}`; // Generate unique request ID for tracing
  
  console.log(`HYDRATION_DEBUG: [${requestId}] Request parameters:`, {
    url: req.url,
    user_id,
    headers: Object.fromEntries([...new Headers(req.headers).entries()])
  });
  
  if (!user_id) {
    console.error(`HYDRATION_DEBUG: [${requestId}] Missing user_id parameter`);
    return NextResponse.json({ error: 'user_id parameter is required', requestId }, { status: 400 });
  }
  
  // Get today's date in ISO format (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  console.log(`HYDRATION_DEBUG: [${requestId}] Fetching data for user ${user_id} on ${today}`);

  // Get the active session for this user
  let activeSession: any = null;
  
  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from('hydration_sessions')
      .select('id, day_start_time, start_time')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();
    
    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        // Not found is expected sometimes
        console.log(`HYDRATION_DEBUG: [${requestId}] No active session found for user ${user_id}`);
      } else {
        console.error(`HYDRATION_DEBUG: [${requestId}] Error fetching active session:`, sessionError);
        return NextResponse.json({ 
          error: sessionError.message, 
          details: 'Error finding active hydration session', 
          requestId 
        }, { status: 500 });
      }
    } else if (sessionData) {
      activeSession = sessionData;
      console.log(`HYDRATION_DEBUG: [${requestId}] Found active session:`, {
        sessionId: activeSession.id,
        dayStartTime: activeSession.day_start_time,
        startTime: activeSession.start_time
      });
    }
  } catch (error: any) {
    console.error(`HYDRATION_DEBUG: [${requestId}] Unexpected error fetching session:`, error);
    return NextResponse.json({
      error: error.message,
      details: 'Unexpected error looking for active session',
      requestId
    }, { status: 500 });
  }

  // If no active session found, we'll use today's date as fallback
  const sessionId = activeSession?.id;
  const dayStartTime = activeSession?.day_start_time || `${today}T00:00:00Z`;
  const sessionEndTime = `${today}T23:59:59Z`; // End of today as default end time

  console.log(`HYDRATION_DEBUG: [${requestId}] Using session: ${sessionId || 'none'} with start time: ${dayStartTime}`);

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
      try {
        // Make sure the session ID is properly formatted before using it
        eventsQuery = eventsQuery.eq('session_id', sessionId);
        console.log(`HYDRATION_DEBUG: [${requestId}] Filtering timeline events by session ID: ${sessionId}`);
      } catch (error) {
        console.error(`HYDRATION_DEBUG: [${requestId}] Error setting session filter: ${error}`);
        // Don't filter by session if there's an error with the UUID
      }
    }
    
    const { data: timeline_events, error: eventError } = await eventsQuery;
      
    if (eventError) {
      console.error(`HYDRATION_DEBUG: [${requestId}] Error fetching timeline events:`, eventError);
      return NextResponse.json({ 
        error: eventError.message, 
        details: 'Failed to retrieve timeline events',
        requestId 
      }, { status: 500 });
    }
    
    // Log timeline results
    console.log(`HYDRATION_DEBUG: [${requestId}] Timeline query results:`, {
      count: timeline_events?.length || 0,
      firstEventTime: timeline_events?.[0]?.event_time || null,
      hasEvents: (timeline_events?.length || 0) > 0
    });
    
    // 2. Get daily hydration targets
    // First try to get targets for the specific session
    let targetQuery = supabase
      .from('daily_targets')
      .select('water_ml, sodium_mg, potassium_mg, protein_g')
      .eq('user_id', user_id);
    
    if (sessionId) {
      // If we have a session, try to get targets for that session
      try {
        targetQuery = targetQuery.eq('session_id', sessionId);
        console.log(`[hydration-raw-data] Filtering daily targets by session ID: ${sessionId}`);
      } catch (error) {
        console.error(`[hydration-raw-data] Error setting session filter for targets: ${error}`);
        // Fall back to date-based query if there's an issue with the UUID
        targetQuery = targetQuery.eq('target_date', today);
      }
    } else {
      // Otherwise, fall back to today's date
      targetQuery = targetQuery.eq('target_date', today);
    }
    
    const { data: targets, error: targetError } = await targetQuery.single();
      
    if (targetError && targetError.code !== 'PGRST116') { // Not found is ok, we'll use defaults
      console.error('[hydration-raw-data] Error fetching daily targets:', targetError);
      return NextResponse.json({ error: targetError.message }, { status: 500 });
    }
    
    // 3. Check if targets were found, return error if not
    if (!targets) {
      console.error('[hydration-raw-data] No hydration targets found for this user/session');
      return NextResponse.json(
        { error: 'No hydration targets found. Please start a new session to calculate your targets.' },
        { status: 404 }
      );
    }
    
    console.log(`[hydration-raw-data] Found ${timeline_events.length} timeline events and targets`);
    
    // 4. Return combined data
    return NextResponse.json({
      timeline_events,
      targets
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('[hydration-raw-data] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
