import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export async function POST(request: Request) {
  try {
    // Check if OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: "OpenAI API key is missing"
      }, { status: 500 });
    }

    // Initialize OpenAI with API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Call OpenAI Responses API with a simple prompt
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: 'Introduce yourself as a hydration coach in one brief paragraph. Be friendly and welcoming.',
    });

    // Extract the response text
    const message = response.output[0].content[0].text;

    return NextResponse.json({
      recommendation: { message }
    });

  } catch (error) {
    console.error('Error:', error);
    // Return error message
    return NextResponse.json({
      error: "Failed to get response from OpenAI Responses API"
    }, { status: 500 });
  }
}
