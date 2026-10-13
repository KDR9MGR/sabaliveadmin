import { supabase } from './supabase.js'
import { relativeTime } from './format.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }

/* Tulasi games (sabalive migrations 20261013100000-120000). The ON/OFF switch is NOT here: it is
   app_config.feature_flags.games_enabled (Application Config -> Release controls, Super Admin), the same switch the app reads. */

export async function getGamesSwitch() {
  const row = unwrap(await supabase.from('app_config').select('feature_flags').eq('id', true).maybeSingle())
  return row?.feature_flags?.games_enabled === true
}

export async function getGameConfig() {
  return unwrap(await supabase.from('game_config')
    .select('max_bet, daily_loss_limit, daily_win_limit, max_payout_multiple, session_hours, min_age, updated_at')
    .eq('id', true).single())
}

const whole = (v, label, min, max) => {
  const n = Number(v)
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${label} must be a whole number between ${min} and ${max}`)
  return n
}

export async function updateGameConfig(v) {
  const patch = {
    max_bet: whole(v.max_bet, 'Largest bet', 0, 1_000_000_000),
    daily_loss_limit: whole(v.daily_loss_limit, 'Daily loss limit', 0, 1_000_000_000),
    daily_win_limit: whole(v.daily_win_limit, 'Daily win limit', 0, 1_000_000_000),
    max_payout_multiple: whole(v.max_payout_multiple, 'Payout multiple', 1, 100000),
    session_hours: whole(v.session_hours, 'Launch lifetime', 1, 48),
    min_age: whole(v.min_age, 'Minimum age', 13, 99),
    updated_at: new Date().toISOString(),
  }
  return unwrap(await supabase.from('game_config').update(patch).eq('id', true).select().single())
}

/* The games the platform sent us ("Sync Game List" in the Tulasi dashboard writes merchant_games; the app reads the same rows live).
   Status 1 = on in the app; 0 = switched off or no longer sent. Pictures are our own copies, not the platform's links. */
export async function listMerchantGames() {
  const rows = unwrap(await supabase.from('merchant_games')
    .select('id, name, identification, image_url, status, hidden, sort_order, updated_at, expiration_date')
    .order('sort_order', { ascending: true }).limit(500))
  return rows.map((g) => ({
    id: g.id,
    name: g.name || '—',
    identification: g.identification || '',
    image: g.image_url || '',
    status: g.status === 1 ? 'On' : 'Off',
    hidden: g.hidden === true,
    // what players actually get: on in Tulasi and not hidden by us
    inApp: g.status === 1 && g.hidden !== true ? 'Shown' : (g.hidden === true ? 'Hidden by us' : 'Off in Tulasi'),
    order: g.sort_order,
    updated: relativeTime(g.updated_at),
    updatedAt: g.updated_at,
    expires: g.expiration_date || '',
  }))
}

/* Hide or show games in the app from here (admin and above). Many at once. Tulasi's own on/off is separate: a Sync never changes this. */
export async function setGamesHidden(ids, hidden) {
  const list = [...new Set((ids || []).map(Number).filter(Number.isFinite))]
  if (!list.length) return 0
  return unwrap(await supabase.rpc('admin_set_games_hidden', { p_ids: list, p_hidden: !!hidden }))
}

/* Per-day totals across everyone for the last [days] days (from the per-person view). */
export async function listGameDays(days = 14) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const rows = unwrap(await supabase.from('game_player_day_totals').select('profile_id, day, bet, won, net, rejected').gte('day', since))
  const byDay = new Map()
  for (const r of rows) {
    const d = byDay.get(r.day) || { id: r.day, day: r.day, players: 0, bet: 0, won: 0, rejected: 0 }
    d.players += 1
    d.bet += Number(r.bet)
    d.won += Number(r.won)
    d.rejected += Number(r.rejected)
    byDay.set(r.day, d)
  }
  return [...byDay.values()].map((d) => ({ ...d, house: d.bet - d.won })).sort((a, b) => (a.day < b.day ? 1 : -1))
}

const TYPE = { 0: 'Bet', 1: 'Win', 2: 'Game coin −', 3: 'Game coin +' }

export async function listRecentGameTransactions(limit = 200) {
  const rows = unwrap(await supabase.from('game_transactions')
    .select('id, transaction_id, type, coin, status, reason, game_type, balance_after, created_at, profiles(name, display_id)')
    .order('created_at', { ascending: false }).limit(limit))
  return rows.map((r) => ({
    id: r.id,
    when: relativeTime(r.created_at),
    player: r.profiles?.name || '—',
    displayId: r.profiles?.display_id,
    kind: TYPE[r.type] || String(r.type),
    coin: Number(r.coin),
    game: r.game_type || '—',
    status: r.status === 'ok' ? 'Ok' : r.status === 'rejected' ? 'Rejected' : 'Pending',
    reason: r.status === 'ok' ? '' : (r.reason || ''),
    balanceAfter: r.balance_after == null ? null : Number(r.balance_after),
    transactionId: r.transaction_id,
  }))
}

async function namesFor(ids) {
  const uniq = [...new Set(ids)].filter(Boolean)
  if (!uniq.length) return new Map()
  const rows = unwrap(await supabase.from('profiles').select('id, name, display_id').in('id', uniq))
  return new Map(rows.map((p) => [p.id, p]))
}

/* People who won in games and gifted coins that day or the next. */
export async function listWinnerGifting(limit = 100) {
  const rows = unwrap(await supabase.from('game_winner_gifting').select('profile_id, day, game_net, gifted, receivers')
    .order('day', { ascending: false }).order('gifted', { ascending: false }).limit(limit))
  const names = await namesFor(rows.map((r) => r.profile_id))
  return rows.map((r) => ({
    id: `${r.profile_id}-${r.day}`, day: r.day, player: names.get(r.profile_id)?.name || '—', displayId: names.get(r.profile_id)?.display_id,
    gameNet: Number(r.game_net), gifted: Number(r.gifted), receivers: Number(r.receivers),
  }))
}

/* Hosts whose gifts that day came partly from people who were net winners in games. */
export async function listHostInflow(limit = 100) {
  const rows = unwrap(await supabase.from('game_host_inflow').select('host_id, day, received, from_game_winners, winner_senders')
    .gt('from_game_winners', 0).order('day', { ascending: false }).order('from_game_winners', { ascending: false }).limit(limit))
  const names = await namesFor(rows.map((r) => r.host_id))
  return rows.map((r) => ({
    id: `${r.host_id}-${r.day}`, day: r.day, host: names.get(r.host_id)?.name || '—', displayId: names.get(r.host_id)?.display_id,
    received: Number(r.received), fromWinners: Number(r.from_game_winners), winnerSenders: Number(r.winner_senders),
    share: r.received > 0 ? Math.round((Number(r.from_game_winners) / Number(r.received)) * 100) : 0,
  }))
}
