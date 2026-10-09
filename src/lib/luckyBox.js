import { supabase } from './supabase.js'
import { shortId, fmtDate } from './admin.js'
import { relativeTime } from './format.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }

/* Singleton config (duration a host must stay continuously live, and the
   one-time coin reward) — see sabalive/supabase/migrations/20260929130000_lucky_box.sql.
   A cron job grants the reward automatically; this is just the two knobs. */
export async function getLuckyBoxConfig() {
  return unwrap(await supabase.from('lucky_box_config')
    .select('duration_minutes, reward_diamonds, cooldown_hours, updated_at')
    .eq('id', true).single())
}

export async function updateLuckyBoxConfig({ duration_minutes, reward_diamonds, cooldown_hours }) {
  const cooldown = Number(cooldown_hours ?? 24)
  if (!Number.isInteger(cooldown) || cooldown < 0 || cooldown > 720) throw new Error('Cooldown must be a whole number of hours between 0 and 720')
  return unwrap(await supabase.from('lucky_box_config')
    .update({ duration_minutes: Number(duration_minutes), reward_diamonds: Number(reward_diamonds), cooldown_hours: cooldown })
    .eq('id', true).select().single())
}

/* Take a paid reward back out of the host's wallet (a Master action). The database refuses when the host has
   already spent the diamonds, or when the reward was pulled back before, and says why. */
export async function pullBackLuckyBox(ledgerId) {
  const { error } = await supabase.rpc('lucky_box_pull_back', { p_ledger_id: ledgerId })
  if (error) throw error
}

/* Every reward granted so far — one wallet_ledger row per win, tagged
   note='lucky_box' by grant_lucky_box_rewards(). */
export async function listLuckyBoxHistory() {
  const rows = unwrap(await supabase.from('wallet_ledger')
    .select('id, amount, reference_id, created_at, profiles(name, username, display_id)')
    .eq('note', 'lucky_box')
    .order('created_at', { ascending: false })
    .limit(500))
  // wins that were taken back again (lucky_box_pull_back writes a reversal row that points at the win)
  const reversals = unwrap(await supabase.from('wallet_ledger')
    .select('reference_id')
    .eq('kind', 'grant_reversal').eq('reference_table', 'wallet_ledger')
    .order('created_at', { ascending: false })
    .limit(500))
  const pulledBack = new Set(reversals.map((x) => x.reference_id))
  return rows.map((r) => ({
    pulledBack: pulledBack.has(r.id),
    id: r.id, idShort: shortId(r.id),
    user: r.profiles?.name || '—',
    username: r.profiles?.username,
    displayId: r.profiles?.display_id,
    diamonds: r.amount,
    streamId: r.reference_id,
    streamIdShort: shortId(r.reference_id),
    date: fmtDate(r.created_at),
    when: relativeTime(r.created_at),
  }))
}
