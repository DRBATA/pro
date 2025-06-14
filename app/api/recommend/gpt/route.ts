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
    
    // Get session_id if available
    const sessionId = requestBody.sessionId || null;
    console.log('Using session ID:', sessionId);
    
    // Extract hydration data from the request body
    const hydrationData = requestBody.hydrationData || {};
    
    // Get timeline events and targets from raw data
    const rawData = hydrationData.rawData || {};
    const timelineEvents = rawData.timeline_events || [];
    
    // Extract targets from rawData or fall back to direct properties
    const targets = rawData.targets || {
      water_ml: hydrationData.targetWaterIntake || 0,
      protein_g: hydrationData.proteinIntake || 0,
      sodium_mg: hydrationData.sodiumIntake || 0,
      potassium_mg: hydrationData.potassiumIntake || 0
    };
    
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
    
    // Setup context based on user's name and daily targets
    const userContext = hydrationData.userProfile?.name
      ? `User's name: ${hydrationData.userProfile.name}\n`
      : '';
      
    // Log the source of targets for debugging
    if (rawData.targets) {
      console.log('Using targets from rawData.targets (database source)');
    } else {
      console.log('Using targets from direct hydrationData properties (frontend calculations)');
    }
    console.log('Using targets:', targets);
    
    // Format the targets for the AI prompt
    const targetsContext = `Daily targets:\n` +
      `- Water: ${targets.water_ml || 0} ml\n` +
      `- Protein: ${targets.protein_g || 0} g\n` +
      `- Sodium: ${targets.sodium_mg || 0} mg\n` +
      `- Potassium: ${targets.potassium_mg || 0} mg\n`;
    
    // NOTE: We're not including currentStatusContext anymore as it was using inconsistent data
    // The AI will infer progress directly from timeline events
      
    // Call OpenAI Responses API with personalized prompt including the input library
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: `${coachSystemPrompt}

      Hello ${name}! I'm your hydration and nutrition coach from Water Bar.
      
      Here's your information for today:
      ${userContext}
      ${targetsContext}
      ${timelineContext}
      ${inputLibraryContext}
      
      Based on your timeline and targets, provide a friendly, actionable plan with specific suggestions on what to consume to meet your remaining nutrient goals today. Use ONLY items from the Available Food & Drink Options list. Keep it brief and engaging.`,
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
    
    // Save the AI response to the timeline
    try {
      // Get the base URL for server-side API calls
      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
      const host = process.env.VERCEL_URL || 'localhost:3000';
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NODE_ENV === 'production'
          ? 'https://thewaterbar.ae'
          : `http://localhost:${process.env.PORT || 3000}`;

      const saveRequestBody = {
        user_id: userId,
        response_id: response_id,
        message: message,
        session_id: sessionId
      };
      
      // Call the save-ai-response endpoint
      console.log('Saving AI response to timeline:', saveRequestBody);
      const saveResponse = await fetch(`${baseUrl}/api/hydration/save-ai-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveRequestBody)
      });
      
      if (!saveResponse.ok) {
        throw new Error(`Failed to save AI response: ${saveResponse.status}`);
      }
      
      console.log('Successfully saved AI response to timeline');
    } catch (error) {
      // Log error but continue - we don't want to block the response if saving fails
      console.error('Error saving AI response to timeline:', error);
    }

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
