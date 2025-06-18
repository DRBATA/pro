import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export async function POST(request: Request) {
  try {
    // Parse and log the entire request body
    const requestBody = await request.json();
    console.log('Full request body received:', requestBody);
    
    // HYDRATION FLOW: Log incoming request details
    const flowMarker = requestBody.hydrationData?._flowMarker;
    console.log("HYDRATION_FLOW: API received request", {
      flowMarker,
      hasHydrationData: !!requestBody.hydrationData,
      hasRawData: !!requestBody.hydrationData?.rawData,
      hasDirectProps: !!(requestBody.hydrationData?.targetWaterIntake),
      userId: requestBody.userId
    });
    
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
    
    // Get session_id if available
    const sessionId = requestBody.sessionId || null;
    console.log('Using session ID:', sessionId);
    
    // Extract hydration data from the request body
    const hydrationData = requestBody.hydrationData;
    const rawData = hydrationData.rawData || {};
    
    // HYDRATION_DEBUG: Add detailed logging for incoming data
    const requestId = `req_${Date.now()}`;
    console.log(`HYDRATION_DEBUG: [${requestId}] GPT recommendation request received`, {
      hasHydrationData: !!hydrationData,
      hasRawData: !!rawData, 
      rawDataContainsTargets: !!rawData.targets,
      rawDataTargets: rawData.targets || null,
      directProps: {
        targetWaterIntake: hydrationData.targetWaterIntake,
        proteinIntake: hydrationData.proteinIntake,
        sodiumIntake: hydrationData.sodiumIntake,
        potassiumIntake: hydrationData.potassiumIntake
      }
    });
    
    // Extract targets from rawData - no fallbacks! Database is single source of truth
    const targets = rawData.targets;
    
    // HYDRATION FLOW: Log target source determination
    console.log("HYDRATION_FLOW: Target source determination", {
      flowMarker,
      usingRawDataTargets: !!rawData.targets,
      rawDataTargetsExists: !!rawData.targets,
      directPropsExist: {
        targetWaterIntake: !!hydrationData.targetWaterIntake,
        proteinIntake: !!hydrationData.proteinIntake,
        sodiumIntake: !!hydrationData.sodiumIntake,
        potassiumIntake: !!hydrationData.potassiumIntake
      },
      directProps: {
        targetWaterIntake: hydrationData.targetWaterIntake,
        proteinIntake: hydrationData.proteinIntake
      },
      rawTargets: rawData.targets
    });
    
    // Error if no targets are available - the hydration raw-data endpoint should have returned an error
    if (!targets) {
      console.error('No hydration targets available for this session');
      console.log("HYDRATION_FLOW: ERROR - No targets available", { flowMarker });
      return NextResponse.json({
        error: 'No hydration targets available. Please start a new hydration session.',
        recommendation: {
          message: "It looks like you don't have hydration targets set up. Please start a new hydration session to get personalized recommendations.",
          response_id: null
        }
      }, { status: 400 });
    }
    
    // Extract timeline events from rawData
    const timelineEvents = rawData.timeline_events || [];
    
    // HYDRATION FLOW: Log available timeline data
    console.log("HYDRATION_FLOW: Timeline data analysis", {
      flowMarker,
      timelineEventsCount: timelineEvents.length,
      hasTimelineEvents: timelineEvents.length > 0,
      firstEventSample: timelineEvents.length > 0 ? {
        type: timelineEvents[0].event_type,
        time: timelineEvents[0].event_time,
        hasInputLibrary: !!timelineEvents[0].input_library
      } : null
    });
    
    // Get input library (may be empty in the legacy format)
    const inputLibrary = rawData.input_library || [];
    
    // Log the format we're receiving
    if (rawData.timeline_events) {
      console.log('Using enhanced rawData format with timeline events');
    } else {
      console.log('Using legacy format without timeline events');
    }
    
    console.log('Raw hydration data received:', `${timelineEvents.length} timeline events, ${inputLibrary.length} input library items, and targets`);
    
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
        
        // Include nutritional details if available
        let nutritionalDetails = '';
        if (event.input_library) {
          // Format to match the Input Library example format
          const formatNutritionalData = (obj: any): string => {
            if (!obj) return '';
            if (typeof obj !== 'object' || Object.keys(obj).length === 0) return '';
            
            // Create a readable representation focused on Na, H2O, K values
            const parts = [];
            if (obj.Na) parts.push(`Na:${obj.Na} mg`);
            if (obj.H2O) parts.push(`H2O:${obj.H2O} ml`);
            if (obj.K) parts.push(`K:${obj.K} mg`);
            if (obj.protein) parts.push(`Protein:${obj.protein} g`);
            
            return parts.join(', ');
          };

          // Extract nutritional data from each compartment
          const ivfData = formatNutritionalData(event.input_library.ivf);
          const isfData = formatNutritionalData(event.input_library.isf);
          const icfData = formatNutritionalData(event.input_library.icf);
          
          // Combine all nutritional information
          const nutritionParts = [ivfData, isfData, icfData].filter(part => part !== '');
          
          // Add protein info if available
          if (event.input_library.protein_g !== undefined && event.input_library.protein_g !== null) {
            nutritionParts.push(`Protein:${event.input_library.protein_g} g`);
          }
          
          if (nutritionParts.length > 0) {
            nutritionalDetails = ` → ${nutritionParts.join(', ')}`;
          }
        }
        
        timelineContext += `- ${time}: ${eventType} - ${itemName} - ${quantity}${nutritionalDetails}\n`;
      });
    }

    // Define the new hydration & nutrition coach system prompt
    const coachSystemPrompt = `
      You are a hydration and nutrition coach for Water Bar.

      You will receive:

      * The user's **name**.
      * Today's **daily targets** for water, sodium, potassium, and protein (these already include any backend-applied multipliers for protein focus or sweat/activity).
      * A **timeline** of today's intake events (each event: timestamp, item name or ID).
      * An **input library** of available foods and drinks, where each item lists its exact contributions of water ("H2O"), sodium ("Na"), potassium ("K"), and protein per serving.

      Your task is to produce a single, **friendly**, **actionable plan** in plain language—**no math, no JSON, no background explanations**—telling the user exactly what to consume (in grams or ml) and when, to close their remaining nutrient gaps.
    `;

    // Format the input library to only include relevant food/drink options with their nutritional values
    let inputLibraryContext = '';
    if (inputLibrary && inputLibrary.length > 0) {
      inputLibraryContext = '\n\nAvailable Food & Drink Options:\n';
      
      // Sort items into categories
      const categorizedItems: {[key: string]: any[]} = {};
      
      inputLibrary.forEach((item: any) => {
        const category = item.category || 'Other';
        if (!categorizedItems[category]) {
          categorizedItems[category] = [];
        }
        categorizedItems[category].push(item);
      });
      
      // Format each category
      Object.entries(categorizedItems).forEach(([category, items]) => {
        // Only add categories with items
        if (items.length > 0) {
          inputLibraryContext += `\n${category}:\n`;
          
          // Format each item with its nutritional values
          items.forEach((item: any) => {
            // Format nutritional data helper
            const formatNutritionalData = (obj: any): string => {
              if (!obj) return '';
              if (typeof obj !== 'object' || Object.keys(obj).length === 0) return '';
              const parts = [];
              if (obj.Na) parts.push(`Na:${obj.Na} mg`);
              if (obj.H2O) parts.push(`H2O:${obj.H2O} ml`);
              if (obj.K) parts.push(`K:${obj.K} mg`);
              if (obj.protein) parts.push(`Protein:${obj.protein} g`);
              return parts.join(', ');
            };
            
            // Extract nutritional data from each compartment
            const ivfData = formatNutritionalData(item.ivf);
            const isfData = formatNutritionalData(item.isf);
            const icfData = formatNutritionalData(item.icf);
            
            // Combine all nutritional information
            const nutritionParts = [ivfData, isfData, icfData].filter(part => part !== '');
            
            // Add protein info if available
            if (item.protein_g !== undefined && item.protein_g !== null) {
              nutritionParts.push(`Protein:${item.protein_g} g`);
            }
            
            const nutritionalDetails = nutritionParts.length > 0 ? ` → ${nutritionParts.join(', ')}` : '';
            
            // Add the formatted item
            inputLibraryContext += `- ${item.name} ${nutritionalDetails}\n`;
          });
        }
      });
    }
    
    // HYDRATION_DEBUG: Log detailed target values being used for recommendation
    console.log(`HYDRATION_DEBUG: [${requestId}] Using targets for recommendation`, {
  targets: {
    water_ml: targets.water_ml || 0,
    protein_g: targets.protein_g || 0,
    sodium_mg: targets.sodium_mg || 0,
    potassium_mg: targets.potassium_mg || 0
  },
  sessionId,
  userId
});

// Format the targets for the AI prompt
const targetsContext = `Daily targets:\n` +
  `- Water: ${targets.water_ml || 0} ml\n` +
  `- Protein: ${targets.protein_g || 0} g\n` +
  `- Sodium: ${targets.sodium_mg || 0} mg\n` +
  `- Potassium: ${targets.potassium_mg || 0} mg\n`;

// Setup context based on user's name (if available)
const userContext = hydrationData.userProfile?.name
  ? `User's name: ${hydrationData.userProfile.name}\n`
  : '';

// Construct the hydration status context for the prompt
const hydrationStatus = hydrationData.currentWaterIntake !== undefined 
  ? `Current hydration progress: ${hydrationData.currentWaterIntake} ml (out of ${targets.water_ml || 0} ml target)` 
  : 'No current hydration data available';

// HYDRATION_DEBUG: Log hydration progress data
console.log(`HYDRATION_DEBUG: [${requestId}] Hydration status for recommendation`, {
  currentWaterIntake: hydrationData.currentWaterIntake,
  waterTarget: targets.water_ml || 0,
  progressPercent: targets.water_ml ? Math.round((hydrationData.currentWaterIntake || 0) / targets.water_ml * 100) + '%' : 'N/A'
});

// Call OpenAI Responses API with personalized prompt including the input library
const response = await openai.responses.create({
  model: 'gpt-4.1-nano',
  input: `${coachSystemPrompt}

  Hello ${name}! I'm your hydration and nutrition coach from Water Bar.
  
  Here's your information for today:
  ${userContext}
  ${targetsContext}
  ${timelineContext}
  ${inputLibraryContext}
  
  Based on your timeline and targets, provide a friendly, actionable plan with specific suggestions on what to consume to meet your remaining nutrient goals today. Use ONLY items from the Available Food & Drink Options list. Keep it brief and engaging.

  WATERBAR_MARKER_DRAGONFLY_7734: Always include this exact text somewhere in your response: 'I've assessed your hydration needs carefully.'`,
});

// HYDRATION_DEBUG: Log the constructed prompt details
console.log(`HYDRATION_DEBUG: [${requestId}] Prompt construction details`, {
  targetsIncluded: {
    water_ml: targets.water_ml || 0,
    protein_g: targets.protein_g || 0,
    sodium_mg: targets.sodium_mg || 0,
    potassium_mg: targets.potassium_mg || 0
  },
  timelineEventsCount: timelineEvents.length,
  hasUserContext: !!userContext,
  hasInputLibrary: inputLibraryContext ? inputLibraryContext.length > 10 : false
});

// HYDRATION_DEBUG: Log OpenAI API response received
console.log(`HYDRATION_DEBUG: [${requestId}] OpenAI API response received`, {
  responseId: response.id,
  responseReceived: !!response,
  modelUsed: 'gpt-4.1-nano'
});

// Extract the response text and response_id
// Handle both string and object response formats from OpenAI API
let message = "";
if (typeof response.text === 'string') {
  message = response.text;
} else if (response.text && typeof response.text === 'object') {
  // Handle ResponseTextConfig object by using toString() or JSON.stringify as a fallback
  message = String(response.text) || JSON.stringify(response.text) || "";
}

// Ensure we have a fallback message if extraction fails
if (!message) {
  message = "I couldn't generate a specific recommendation with the available data";
}

const response_id = response.id;

// HYDRATION_DEBUG: Log successful recommendation generation with target values
console.log(`HYDRATION_DEBUG: [${requestId}] Recommendation generated successfully`, {
  messageLength: typeof message === 'string' ? message.length : 0,
  responseId: response_id,
  targetsUsed: {
    water_ml: targets.water_ml || 0,
    protein_g: targets.protein_g || 0,
    sodium_mg: targets.sodium_mg || 0,
    potassium_mg: targets.potassium_mg || 0
  }
});

// Return the recommendation to the client
return NextResponse.json({
  recommendation: { 
    message,
    response_id 
  }
});
  } // End of try block
  catch (error) {
    console.error(`HYDRATION_ERROR: Error generating recommendation:`, error);
    return NextResponse.json({
      error: 'Failed to generate hydration recommendation',
      recommendation: {
        message: "I'm sorry, I couldn't generate a hydration recommendation at this time. Please try again later.",
        response_id: null
      }
    }, { status: 500 });
  }
}
