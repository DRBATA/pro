import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Define types for timeline and library items
interface TimelineEvent {
  id: string;
  time: string;
  type: string;
  amount?: number;
  description?: string;
  itemId?: string;
}

interface LibraryItem {
  id: string;
  name: string;
  category: string;
  waterContent?: number;
  sodium?: number;
  potassium?: number;
  protein?: number;
  description?: string;
}

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
    
    // Extract the name directly from the request body if available
    let name = 'User';
    
    if (requestBody.hydrationData && requestBody.hydrationData.userProfile && requestBody.hydrationData.userProfile.name) {
      name = requestBody.hydrationData.userProfile.name;
      console.log('Using name from user profile:', name);
    } else {
      console.log('No name found in user profile, using default');
    }
    
    // Extract other useful hydration data for the AI
    const hydrationData = requestBody.hydrationData || {};
    const currentWaterIntake = hydrationData.currentWaterIntake || 0;
    const targetWaterIntake = hydrationData.targetWaterIntake || 2750;
    const progressPercentage = Math.round((currentWaterIntake / targetWaterIntake) * 100);
    
    console.log('Hydration progress:', `${progressPercentage}% (${currentWaterIntake}/${targetWaterIntake}ml)`);
    
    // Extract timeline data and library items
    const timelineData = requestBody.timelineData || {};
    const events: TimelineEvent[] = timelineData.events || [];
    const libraryItems: LibraryItem[] = timelineData.libraryItems || [];
    
    // Log timeline data for debugging
    console.log(`Received ${events.length} timeline events and ${libraryItems.length} library items`);
    
    // Format timeline events with their nutritional meaning
    let timelineAnalysis = '';
    
    if (events.length > 0) {
      // Group events by type for a cleaner summary
      const waterEvents = events.filter(e => e.type === 'water' || e.type === 'drink');
      const foodEvents = events.filter(e => e.type === 'food');
      const exerciseEvents = events.filter(e => e.type === 'exercise');
      
      timelineAnalysis = 'Timeline analysis:\n';
      
      // Analyze water intake events
      if (waterEvents.length > 0) {
        const totalWater = waterEvents.reduce((sum, e) => sum + (e.amount || 0), 0);
        timelineAnalysis += `- Water: You've had ${totalWater}ml from ${waterEvents.length} drink(s)\n`;
        
        // Include details of specific drinks if available
        waterEvents.forEach(event => {
          const item = libraryItems.find(item => item.id === event.itemId);
          if (item) {
            timelineAnalysis += `  * ${item.name}: ${event.amount || 0}ml at ${event.time}\n`;
          }
        });
      }
      
      // Analyze food intake
      if (foodEvents.length > 0) {
        timelineAnalysis += `- Food: You've consumed ${foodEvents.length} food item(s)\n`;
        
        // Include nutritional details of foods
        foodEvents.forEach(event => {
          const item = libraryItems.find(item => item.id === event.itemId);
          if (item) {
            timelineAnalysis += `  * ${item.name} at ${event.time}`;
            if (item.waterContent) timelineAnalysis += ` (water: ${item.waterContent}ml)`;
            if (item.sodium) timelineAnalysis += ` (sodium: ${item.sodium}mg)`;
            if (item.potassium) timelineAnalysis += ` (potassium: ${item.potassium}mg)`;
            timelineAnalysis += '\n';
          }
        });
      }
      
      // Include exercise information
      if (exerciseEvents.length > 0) {
        timelineAnalysis += `- Exercise: You've done ${exerciseEvents.length} exercise session(s)\n`;
        exerciseEvents.forEach(event => {
          timelineAnalysis += `  * ${event.description || 'Exercise'} at ${event.time}\n`;
        });
      }
    } else {
      timelineAnalysis = "You haven't logged any hydration events today.";
    }
    
    // Calculate remaining targets
    const waterRemaining = targetWaterIntake - currentWaterIntake;
    const waterPercentage = Math.min(100, Math.round((currentWaterIntake / targetWaterIntake) * 100));


    // Call OpenAI Responses API with personalized prompt
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: `You are a hydration coach for Water Bar. Say hello to ${name} and provide personalized hydration advice based on their timeline data.
      
      CURRENT STATUS:
      - Water: ${waterPercentage}% complete (${currentWaterIntake}ml out of ${targetWaterIntake}ml target)
      - ${waterRemaining}ml of water still needed today
      
      ${timelineAnalysis}
      
      Based on this information, provide specific, actionable advice on what ${name} should consume for the rest of the day to meet their hydration targets. Consider timing, previous consumption, and activity.
      
      Keep your response brief, friendly and casual. Include an emoji or two to make it engaging.`,
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
