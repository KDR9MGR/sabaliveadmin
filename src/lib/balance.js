import { supabase } from './supabase.js'

/* The signed-in staff member's own coin balance — shown in the top bar of every
   panel (Master, Global, Country, Sub, Agency), since coins are held at every
   level and move down the ladder. Master and Super Admin also see the platform
   treasury they mint into and distribute from. */
export async function myBalances(userId, role) {
  const wallet = await supabase.from('wallets').select('coins').eq('profile_id', userId).maybeSingle()
  const out = { wallet: Number(wallet.data?.coins ?? 0), treasury: null }
  if (role === 'admin' || role === 'super_admin') {
    const t = await supabase.from('coin_treasury').select('balance').eq('id', true).maybeSingle()
    if (!t.error && t.data) out.treasury = Number(t.data.balance)
  }
  return out
}

/* Anything that moves coins calls this, so the top bar updates at once. */
export const COINS_CHANGED = 'coins:changed'
export const notifyCoinsChanged = () => window.dispatchEvent(new Event(COINS_CHANGED))
