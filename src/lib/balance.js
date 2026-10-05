import { supabase } from './supabase.js'

/* The signed-in staff member's own coin balance — shown in the top bar of every
   panel (Master, Global, Country, Sub, Agency), since coins are held at every
   level and move down the ladder. Master and Super Admin also see the platform
   treasury they mint into and distribute from. */
export async function myBalances(userId, role) {
  const wallet = await supabase.from('wallets').select('coins').eq('profile_id', userId).maybeSingle()
  // The platform treasury is readable only by Master / Super Admin and accounts on
  // the coin-minter allow-list (RLS), so asking every role is safe: a plain staff
  // account just gets no row back.
  const t = await supabase.from('coin_treasury').select('balance').eq('id', true).maybeSingle()
  return {
    wallet: Number(wallet.data?.coins ?? 0),
    // A Super Admin holds no coins of their own (coins can't be sent up to a platform
    // admin) — what they control is the treasury, so don't show a misleading 0.
    showWallet: role !== 'super_admin',
    treasury: !t.error && t.data ? Number(t.data.balance) : null,
    treasuryIsOwn: role !== 'admin' && role !== 'super_admin',
  }
}

/* Anything that moves coins calls this, so the top bar updates at once. */
export const COINS_CHANGED = 'coins:changed'
export const notifyCoinsChanged = () => window.dispatchEvent(new Event(COINS_CHANGED))
