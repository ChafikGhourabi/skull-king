// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

// Runtime assertion — fail loudly in dev if env vars missing (RESEARCH.md Pitfall 5, mitigates T-1-06)
if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase env vars. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.'
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    flowType: 'pkce',          // secure SPA default — never expose token in URL hash (T-1-03)
    detectSessionInUrl: true,  // auto-exchanges ?code= on load (OAuth + email verify)
    persistSession: true,      // JWT in localStorage (default true)
    autoRefreshToken: true,    // default true
  },
})
