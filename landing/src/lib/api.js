/* Calls into the Saba Live Supabase project's public Edge Functions.
   The anon/publishable key is safe to ship in client code — see the note
   in sabalive/lib/config/supabase_client.dart; every table it can touch is
   gated by Row Level Security. */

const SUPABASE_URL = 'https://sfehzhtqtpuobnrvzvzp.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_vdDsGi-wEgeJm_BpQE7MlA_Z5ZusWOi'

/* Logs an account-deletion request. Always resolves — the Edge Function
   itself never reveals whether the email matches a real account, so a
   failed fetch is the only error case callers need to handle. */
export async function requestAccountDeletion({ email, reason }) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/request-account-deletion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email, reason: reason || undefined }),
  })
  if (!res.ok) throw new Error(`request-account-deletion failed: ${res.status}`)
}
