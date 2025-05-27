import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/database.types'

// This route is called when a user verifies their email
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  
  // If there's no code, redirect to the login page
  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=missing_code`)
  }

  // Create a Supabase client for this specific route handler
  const supabase = createRouteHandlerClient<Database>({ cookies })
  
  try {
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
      )
    }

    // Get user session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_session`)
    }
    
    // Check if user exists in our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single()
    
    // If user doesn't exist in our database or there's an error
    if (userError && userError.code !== 'PGRST116') { // Not PGRST116 (record not found)
      console.error('Error fetching user data:', userError)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=user_fetch_error`)
    }
    
    // Redirect based on user status
    if (!userData) {
      // New user who just verified their email but hasn't completed registration
      return NextResponse.redirect(`${requestUrl.origin}/register?email=${encodeURIComponent(session.user.email)}&verified=true`)
    }
    
    // Existing user - redirect to dashboard with success message
    return NextResponse.redirect(
      `${requestUrl.origin}${userData.is_staff ? '/staff' : '/dashboard'}?verified=true`
    )
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=unexpected_error`
    )
  }
}
