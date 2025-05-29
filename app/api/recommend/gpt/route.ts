import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

// Add type safety for request payload
interface RequestPayload {
  userId: string;
}

// Add type for user data
interface UserData {
  nickname?: string;
}

export async function POST(request: Request) {
  try {
    // Check if OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: "OpenAI API key is missing"
      }, { status: 500 });
    }

    // Get user ID from request with proper typing
    const { userId }: RequestPayload = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    // Initialize Supabase client with hardcoded credentials
    const supabase = createClient(
      'https://czsgyjuhmazhgyzgizjb.supabase.co', // Your Supabase URL
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6c2d5anVobWF6aGd5emdpempiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODA3MjE2MDAsImV4cCI6MTk5NjI5NzYwMH0.SZLqryz_-J3jKEp7I72DvCM0aSx0NLnmsh0VL-fGhFY' // Your anon/public key
    );
    
    // Get user nickname from the users table
    const { data: userData, error } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user data:', error);
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }
    
    // Validate userData before using
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Initialize OpenAI with API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Use optional chaining clearly
    const nickname = userData?.nickname || 'User';

    // Call OpenAI Responses API with personalized prompt
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: `You are a hydration coach for Water Bar. Say hello to ${nickname} and provide a friendly welcome message about hydration. Keep it brief and casual.`,
    });

    // Extract the response text safely with type checking
    const outputItem = response.output[0];

    if ('content' in outputItem && outputItem.content.length > 0) {
      const contentItem = outputItem.content[0];
      
      if ('text' in contentItem) {
        const message = contentItem.text;
        return NextResponse.json({
          recommendation: { message }
        });
      }
    }
    
    // If we reach here, the response format was not as expected
    throw new Error('Unexpected response format from OpenAI');

  } catch (error) {
    console.error('Error generating recommendation:', error);
    return NextResponse.json({
      error: "Failed to generate recommendation"
    }, { status: 500 });
  }
}
