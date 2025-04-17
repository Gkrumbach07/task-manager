import { createClient } from "@supabase/supabase-js"

// Create a singleton instance of the Supabase client for client-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
