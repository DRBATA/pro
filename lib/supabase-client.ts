import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Using createBrowserClient from @supabase/ssr for better authentication handling
// This is the recommended approach replacing createClientComponentClient
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
