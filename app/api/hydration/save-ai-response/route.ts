import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create admin Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * API endpoint to save an AI response as a timeline event
 * This allows us to store AI hydration coaching responses in the timeline
 * with their associated response_id for future reference
 */
export async function POST(req: Request) {
  console.log('[save-ai-response] API called');
  
  try {
    const { user_id, response_id, message, session_id } = await req.json();
    
    if (!user_id || !response_id || !message) {
      console.error('[save-ai-response] Missing required parameters');
      return NextResponse.json(
        { error: 'user_id, response_id, and message parameters are required' }, 
        { status: 400 }
      );
    }
    
    console.log(`[save-ai-response] Saving response for user ${user_id} with response_id: ${response_id}`);
    
    // Create a timeline event for the AI response
    const { data: newEvent, error } = await supabase
      .from('timeline_events')
      .insert({
        user_id,
        session_id: session_id || null, // Optional session ID
        event_type: 'ai_response',
        event_time: new Date().toISOString(),
        response_id,
        notes: message,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[save-ai-response] Error saving timeline event:', error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }
    
    console.log(`[save-ai-response] Successfully saved AI response as timeline event with ID: ${newEvent.id}`);
    
    // Return the created timeline event
    return NextResponse.json({
      success: true,
      timeline_event: newEvent
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('[save-ai-response] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save AI response' }, 
      { status: 500 }
    );
  }
}
