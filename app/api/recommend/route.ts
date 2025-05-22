import { NextResponse } from "next/server"
import { getHydrationArchetype, archetypeToKits, type HydrationParams } from "@/lib/hydration-engine"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { activity, time, hydration_gap, mood } = body as HydrationParams

    const archetype = getHydrationArchetype({ activity, time, hydration_gap, mood })
    const kits = archetypeToKits[archetype] || []

    return NextResponse.json({ archetype, kits })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
