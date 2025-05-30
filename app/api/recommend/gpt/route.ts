import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Parse and log the entire request body
    const requestBody = await request.json();
    console.log('Full request body received:', requestBody);
    
    // Extract userId and log it
    const { userId } = requestBody;
    console.log('Extracted userId:', userId);

    // Initialize OpenAI client if API key exists
    if (!process.env.OPENAI_API_KEY) {
      // Fallback if no API key is available
      return NextResponse.json({
        recommendation: {
          message: "Welcome! I'm your hydration coach. I can help you stay properly hydrated throughout the day."
        }
      });
    }

    // Initialize OpenAI with API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    let nickname = 'User';
    
    // If we have userId and Supabase credentials, try to get the nickname
    if (userId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Initialize Supabase client
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // Get user nickname from the users table
        const { data: userData } = await supabase
          .from('users')
          .select('nickname')
          .eq('id', userId)
          .single();
        
        if (userData && userData.nickname) {
          nickname = userData.nickname;
        }
      } catch (supabaseError) {
        console.error('Supabase error:', supabaseError);
        // Continue with default nickname if Supabase fails
      }
    }

    // Call OpenAI Responses API with personalized prompt
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: `You are a hydration coach for Water Bar. Say hello to ${nickname} and provide a friendly welcome message about hydration. Keep it brief and casual.`,
    });

    // Extract the response text - this might throw TypeScript errors but should work at runtime
    const message = response.output[0].content[0].text;

    return NextResponse.json({
      recommendation: { message }
    });

  } catch (error) {
    console.error('Error:', error);
    // Fallback message if anything goes wrong
    return NextResponse.json({
      recommendation: {
        message: "Welcome! I'm your hydration coach. I can help you stay properly hydrated throughout the day."
      }
    });
  }
}
