import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Fixed recommendation message - no AI, no database
  const recommendation = {
    message: "Based on your hydration timeline, I recommend drinking 500ml of water and eating a banana for potassium balance. Your daily water target is 2500ml."
  };

  // Just return the fixed message
  return NextResponse.json({ recommendation });
}
