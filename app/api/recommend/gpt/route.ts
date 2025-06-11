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
    
    // Get timeline events with input library data
    const rawData = hydrationData.rawData || {};
    const timelineEvents = rawData.timeline_events || [];
    const targets = rawData.targets || {};
    
    // Log the actual timeline events (careful with PII data)
    console.log(`Found ${timelineEvents.length} timeline events to analyze`);
    
    // Format timeline events for the prompt
    let timelineContext = '';
    if (timelineEvents.length > 0) {
      timelineContext = '\n\nRecent hydration timeline:\n';
      
      // Sort events by time (most recent first)
      const sortedEvents = [...timelineEvents].sort((a, b) => 
        new Date(b.event_time).getTime() - new Date(a.event_time).getTime()
      ).slice(0, 5); // Limit to 5 most recent events
      
      sortedEvents.forEach(event => {
        const time = new Date(event.event_time).toLocaleTimeString('en-US', {
          hour: '2-digit', 
          minute: '2-digit'
        });
        
        const itemName = event.input_library ? event.input_library.name : 'Unknown item';
        const eventType = event.event_type || 'event';
        const quantity = event.quantity || 0;
        
        // Include hydration details if available
        let hydrationDetails = '';
        if (event.input_library && eventType === 'drink') {
          const ivf = event.input_library.ivf || 0;
          const isf = event.input_library.isf || 0;
          const icf = event.input_library.icf || 0;
          
          if (ivf || isf || icf) {
            hydrationDetails = ` (ivf:${ivf}%, isf:${isf}%, icf:${icf}%)`;
          }
        }
        
        timelineContext += `- ${time}: ${eventType} - ${itemName} - ${quantity}${hydrationDetails}\n`;
      });
    }

    // Define hydration science context for the AI
    const hydrationScienceContext = `
      HYDRATION SCIENCE REFERENCE:
      
      • Fluid Compartments: The human body has 3 main fluid compartments that require proper hydration:
      
      1. IVF (Intra-Vascular Fluid): 
         - Blood plasma compartment
         - Affects blood pressure, circulation, nutrient delivery
         - Key electrolytes: Sodium (Na+), small amounts of potassium (K+)
         - Represents ~5% of body weight
      
      2. ISF (Inter-Stitial Fluid):
         - Fluid between cells
         - Delivers nutrients from bloodstream to cells
         - Removes cellular waste
         - Similar electrolyte profile to plasma but with less protein
         - Represents ~15% of body weight
      
      3. ICF (Intra-Cellular Fluid):
         - Fluid inside cells
         - Critical for cellular functions and metabolism
         - High in potassium (K+), low in sodium (Na+)
         - Contains proteins and other essential molecules
         - Represents ~40% of body weight
      
      • Fluid & Electrolyte Impact in Timeline Events:
        - When you see ivf/isf/icf values in drinks, they represent how fluids distribute to each compartment
        - High ivf values: Increases blood plasma volume more rapidly (e.g., isotonic sports drinks)
        - High isf values: Better extracellular hydration (e.g., electrolyte waters)
        - High icf values: Better cellular hydration (e.g., water with higher potassium)
      
      • Hydration Quality Metrics:
        - Optimal hydration requires proper fluid distribution across all compartments
        - Electrolyte balance is as important as total water intake
        - Timing of intake affects absorption and utilization
        - Temperature, activity level and climate affect hydration needs
    `;

    // Call OpenAI Responses API with personalized prompt
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: `You are a hydration coach for Water Bar. Say hello to ${name} and provide a friendly welcome message about hydration.
      
      Current hydration progress: ${progressPercentage}% (${currentWaterIntake}ml out of ${targetWaterIntake}ml target).
      
      Daily targets: Water: ${targets.water_ml || targetWaterIntake}ml, Protein: ${targets.protein_g || 0}g, Sodium: ${targets.sodium_mg || 0}mg, Potassium: ${targets.potassium_mg || 0}mg${timelineContext}
      
      ${hydrationScienceContext}
      
      Use your understanding of hydration science to provide helpful context about their hydration quality, not just quantity. If relevant, briefly explain how their drink choices are affecting different fluid compartments.
      
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
