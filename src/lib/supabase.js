import { createClient } from '@supabase/supabase-js'
import { activeEnvironment, PRODUCTION_REF } from './environments.js'

// the home project of this build, or the staging project when a Master / Super Admin switched to it (environments.js)
const url = activeEnvironment.url
const anonKey = activeEnvironment.anonKey

// A staging run must never talk to production. `.env.local` (production values) is loaded in EVERY mode as a
// fallback, so a missing `.env.staging.local` would silently use production: refuse instead.
if (import.meta.env.MODE === 'staging' && (!url || url.includes(PRODUCTION_REF))) {
  throw new Error(
    'Staging mode, but VITE_SUPABASE_URL is missing or is the production project. Create .env.staging.local with the staging URL and key.'
  )
}

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in the project values.'
  )
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
})
