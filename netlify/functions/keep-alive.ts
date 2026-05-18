// netlify/functions/keep-alive.ts
// Prevents Supabase free-tier project from pausing after 7 days of inactivity (D-15)
import type { Config } from "@netlify/functions"

export default async () => {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/`
  await fetch(url, {
    headers: {
      apikey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
    },
  })
  console.log('[keep-alive] Supabase ping sent at', new Date().toISOString())
}

// Run every 3 days at midnight UTC (within the 7-day inactivity threshold — D-15)
export const config: Config = {
  schedule: "0 0 */3 * *",
}
