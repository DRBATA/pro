import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

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


    // Call OpenAI Responses API with personalized prompt
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: `You are a hydration coach for Water Bar. Say hello to ${name} and provide a friendly welcome message about hydration.
      
      Current hydration progress: ${progressPercentage}% (${currentWaterIntake}ml out of ${targetWaterIntake}ml target).
      
      Keep your response brief, friendly and casual. Include an emoji or two to make it engaging.`,
    });

    // Extract the response text and response_id
    let message = "";
    const response_id = response.id;
    
    // Extract text from response using a safer approach that's compatible with TypeScript
    try {
      // Access response.output safely with type assertions
      const output = response.output as any[];
      if (output && output.length > 0) {
        const firstOutput = output[0];
        
        // Handle different response formats
        if (firstOutput && typeof firstOutput === 'object') {
          // For message format with content array
          if (firstOutput.content && Array.isArray(firstOutput.content) && firstOutput.content.length > 0) {
            const firstContent = firstOutput.content[0];
            if (firstContent && firstContent.text) {
              message = firstContent.text;
            }
          } 
          // Sometimes the response might be structured differently
          else if (firstOutput.text && typeof firstOutput.text === 'string') {
            message = firstOutput.text;
          }
        }
      }
      
      if (!message) {
        console.warn('Could not extract message from response using expected structure:', JSON.stringify(response));
        message = "Welcome! I'm your hydration coach. How can I help you today?";
      }
    } catch (error) {
      console.error('Error extracting message from response:', error);
      message = "Welcome! I'm your hydration coach. How can I help you today?";
    }
    
    console.log('Generated response_id:', response_id);

    return NextResponse.json({
      recommendation: { 
        message,
        response_id 
      }
    });

  } catch (error) {
    console.error('Error:', error);
    // Fallback message if anything goes wrong
    return NextResponse.json({
      recommendation: {
        message: "Welcome! I'm your hydration coach. I can help you stay properly hydrated throughout the day.",
        response_id: null
      }
    });
  }
}
