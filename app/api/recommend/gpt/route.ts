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
