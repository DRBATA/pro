import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * API endpoint to retrieve an assistant message by response_id from OpenAI
 * This allows us to fetch previous hydration coach responses without storing them in our DB
 */
export async function GET(req: Request) {
  console.log('[assistant-message] API called');
  
  // Parse response_id from query params
  const url = new URL(req.url);
  const response_id = url.searchParams.get('response_id');
  
  if (!response_id) {
    console.error('[assistant-message] Missing response_id parameter');
    return NextResponse.json(
      { error: 'response_id parameter is required' }, 
      { status: 400 }
    );
  }
  
  console.log(`[assistant-message] Fetching message for response_id: ${response_id}`);

  try {
    // Call OpenAI to retrieve the assistant message using the responses feature
    const response = await openai.responses.retrieve(response_id);
    
    if (!response || !response.output || response.output.length === 0) {
      console.error('[assistant-message] No message found for this response_id');
      return NextResponse.json(
        { error: 'No message found for this response_id' }, 
        { status: 404 }
      );
    }
    
    console.log('[assistant-message] Successfully retrieved message');
    
    // Extract text content from the response
    let textContent = '';
    
    // Handle different response output types
    if (response.output && response.output.length > 0) {
      const outputItem = response.output[0];
      
      // Check if it's a text response
      if ('content' in outputItem && 
          Array.isArray(outputItem.content) && 
          outputItem.content.length > 0 &&
          'text' in outputItem.content[0]) {
        textContent = outputItem.content[0].text || '';
      }
    }
    
    // Return the message content
    return NextResponse.json({
      text: textContent,
      retrieved_at: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('[assistant-message] Error retrieving message:', error);
    
    // Handle different error types
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Message not found. It may have expired or been deleted.' }, 
        { status: 404 }
      );
    } else if (error.status === 401) {
      return NextResponse.json(
        { error: 'Authentication error. Check your OpenAI API key.' }, 
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve assistant message' }, 
      { status: 500 }
    );
  }
}
