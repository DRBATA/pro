import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { getUserTimelineEvents } from '@/lib/hydration-data-functions';
import { getUserProfile } from '@/lib/client-functions';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get user timeline events
    const timelineEvents = await getUserTimelineEvents(userId);
    
    // Get user profile data
    const userProfile = await getUserProfile(userId);
    
    // If no data is found, return a simple recommendation
    if (!timelineEvents.length && !userProfile) {
      return NextResponse.json({
        recommendation: {
          message: "Based on general guidelines, I recommend drinking 2000ml of water throughout the day. Consider adding electrolytes if you're exercising."
        }
      });
    }
    
    // Calculate current water intake from timeline
    const waterIntake = timelineEvents
      .filter(event => event.event_type === 'drink')
      .reduce((total, event) => total + (event.quantity || 0), 0);
    
    // Calculate target based on user profile
    const weight = userProfile?.weight || 70; // Default to 70kg
    const targetWaterIntake = Math.round(weight * 35); // 35ml per kg of body weight
    
    // Calculate water gap
    const waterGap = targetWaterIntake - waterIntake;
    
    // Simplify timeline data for GPT
    const simplifiedEvents = timelineEvents.map(event => ({
      type: event.event_type,
      amount: event.quantity,
      time: new Date(event.event_time).toLocaleTimeString(),
      description: event.notes
    }));
    
    // Context for GPT
    const context = {
      user: {
        weight: userProfile?.weight || 70,
        sex: userProfile?.sex || 'not specified',
        bodyType: userProfile?.body_type || 'average'
      },
      hydration: {
        currentIntake: waterIntake,
        target: targetWaterIntake,
        gap: waterGap
      },
      recentEvents: simplifiedEvents
    };
    
    // Simple prompt for minimal implementation
    let prompt = `You are a hydration coach giving advice to a user. Here's their current data:\n`;
    prompt += `Weight: ${context.user.weight}kg\n`;
    prompt += `Sex: ${context.user.sex}\n`;
    prompt += `Body type: ${context.user.bodyType}\n`;
    prompt += `Current water intake: ${context.hydration.currentIntake}ml\n`;
    prompt += `Target water intake: ${context.hydration.target}ml\n`;
    prompt += `Water gap: ${context.hydration.gap}ml\n\n`;
    
    if (simplifiedEvents.length > 0) {
      prompt += `Recent timeline events:\n`;
      simplifiedEvents.forEach(event => {
        prompt += `- ${event.time}: ${event.type} ${event.amount || ''}${event.type === 'drink' ? 'ml' : event.type === 'food' ? 'g' : ''} ${event.description || ''}\n`;
      });
      prompt += `\n`;
    }
    
    prompt += `Provide a short, friendly recommendation for how they should adjust their hydration. Mention specific amounts and types of liquids to consume, and consider their activity level based on timeline events. Keep your advice under 80 words.`;
    
    // For a minimal implementation, you can use a simpler OpenAI call
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful hydration coach that gives concise, science-based advice." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });
    
    const recommendation = {
      message: response.choices[0].message.content || "I recommend drinking more water throughout the day to meet your hydration goals."
    };
    
    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error('Error generating recommendation:', error);
    return NextResponse.json({ 
      recommendation: { 
        message: "Based on general guidelines, I recommend drinking water regularly throughout the day. Stay hydrated!" 
      }
    });
  }
}
