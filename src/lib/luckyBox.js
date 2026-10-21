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

/* Every live of the last 7 days with the Lucky Box outcome and, when it didn't open, why — the same rules the cron job
   applies (see lucky_box_history, migration 20261014100000). The server caps the window at 7 days, so older lives
   drop off on their own. */
export const LB_RESULTS = {
  paid: { label: 'Paid', tone: 'success', hint: 'The box opened and was paid.' },
  pulled_back: { label: 'Pulled back', tone: 'warning', hint: 'Paid, then taken back by a Master.' },
  in_progress: { label: 'In progress', tone: 'info', hint: 'Still live, has not reached the duration yet.' },
  too_short: { label: 'Too short', tone: 'muted', hint: 'Ended (or stopped sending) before the duration.' },
  audio_room: { label: 'Audio room', tone: 'violet', hint: 'Audio rooms never earn the Lucky Box.' },
  cooldown: { label: 'Cooldown', tone: 'warning', hint: 'The host was paid within the cooldown before this box would have opened.' },
  eligible_unpaid: { label: 'Not paid — should have', tone: 'danger', hint: 'Met every rule but has no payout. Worth a look.' },
}

/* Pay one missed live by hand (Master). The database re-checks every rule — video, the host's own signal proves the
   duration, not already paid, not inside the cooldown, last 7 days — and refuses with the reason if one fails. */
export async function payLuckyBoxNow(streamId) {
  const { data, error } = await supabase.rpc('lucky_box_pay_now', { p_stream_id: streamId })
  if (error) throw error
  return data
}

export async function listLuckyBoxLives() {
  const { data, error } = await supabase.rpc('lucky_box_history', { p_days: 7 })
  if (error) throw error
  return (data || []).map((r) => ({
    id: r.stream_id,
    hostId: r.host_id,
    host: r.host_name || '—',
    username: r.host_username,
    displayId: r.host_display_id,
    mode: r.mode === 'audio' ? 'Audio' : 'Video',
    status: r.status,
    started: fmtDate(r.started_at),
    startedAt: r.started_at,
    when: relativeTime(r.started_at),
    minutes: r.live_minutes,
    reward: r.reward_diamonds,
    result: r.result,
    restHours: r.rest_hours != null ? Number(r.rest_hours) : null,
  }))
}

/* Extra boxes in one day (migration 20261021100000): per host and IST day the first box stays, every further one can be taken back.
   `from` / `to` are 'YYYY-MM-DD' IST days, both included. The preview lists them; the pull-back skips any host who no longer holds
   the diamonds and says who. */
export async function listExtraLuckyBoxes(from, to) {
  const { data, error } = await supabase.rpc('lucky_box_extra_wins', { p_from: from, p_to: to })
  if (error) throw error
  return (data || []).map((r) => ({
    id: r.ledger_id,
    hostId: r.host_id,
    host: r.host_name || '—',
    username: r.host_username,
    displayId: r.host_display_id,
    wonAt: r.won_at,
    won: fmtDate(r.won_at),
    day: r.win_day,
    winsThatDay: r.wins_that_day,
    diamonds: Number(r.diamonds),
    balance: Number(r.host_balance),
    canCover: !!r.can_cover,
  }))
}

export async function pullBackExtraLuckyBoxes(from, to) {
  const { data, error } = await supabase.rpc('lucky_box_pull_back_extras', { p_from: from, p_to: to })
  if (error) throw error
  return data // { pulled, diamonds, hosts, skipped: [{ host, diamonds, balance, ... }] }
}
