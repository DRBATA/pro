import { createClient } from '@supabase/supabase-js'

// Hard-coded Supabase credentials - eliminates environment variable issues
const supabaseUrl = 'https://zzxejyjumazhgwzghxh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVqeWp1bWF6aGd3emdoeGgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNjk4OTg5MCwiZXhwIjoyMDMyNTY1ODkwfQ.UeAk5YiKoRc-p6NwXe3YIkR4kgTmvAG6-KDI5JD13rw'

// Use the direct credentials instead of environment variables
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
