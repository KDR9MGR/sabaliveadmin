import { supabase } from './supabase.js'
import { shortId } from './admin.js'

export { profileOptions } from './coins.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const titleCase = (s) => (s ? String(s).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s)
const int = (v) => (v == null || v === '' ? 0 : Number(v))

export const BADGE_STATUSES = ['active', 'inactive']
export const FRAME_STATUSES = ['active', 'draft']
export const FRAME_UNLOCK_TYPES = ['free', 'level', 'vip', 'coins', 'event']
export const LBF_SCOPES = ['global', 'agency', 'regional']
export const LBF_PERIODS = ['weekly', 'monthly', 'season']
export const LBF_STATUSES = ['active', 'scheduled']

const unlockLabel = (type, value) => {
  switch (type) {
    case 'level': return `Level ${value || 0}`
    case 'coins': return `${value || 0} coins`
    case 'vip': return 'VIP'
    case 'event': return 'Event'
    default: return 'Free'
  }
}

/* ---------------------------------------------------------------- badges */
export async function listBadges() {
  const [badges, holders] = await Promise.all([
    supabase.from('badges').select('id, name, emoji, criteria, status, sort_order').order('sort_order').order('name'),
    supabase.from('user_badges').select('badge_id'),
  ])
  if (badges.error) throw badges.error
  if (holders.error) throw holders.error
  const counts = {}
  for (const r of holders.data) counts[r.badge_id] = (counts[r.badge_id] || 0) + 1
  return badges.data.map((b) => ({
    id: b.id, idShort: shortId(b.id),
    name: b.name, emoji: b.emoji || '🏅',
    criteria: b.criteria || '—',
    sortOrder: b.sort_order || 0,
    holders: counts[b.id] || 0,
    status: titleCase(b.status),
  }))
}
export async function createBadge(v) {
  return unwrap(await supabase.from('badges').insert({
    name: v.name,
    emoji: v.emoji || '🏅',
    criteria: v.criteria || null,
    sort_order: int(v.sort_order),
    status: (v.status || 'active').toLowerCase(),
  }).select().single())
}
export async function updateBadge(id, v) {
  const p = {}
  if (v.name != null) p.name = v.name
  if (v.emoji != null) p.emoji = v.emoji
  if (v.criteria !== undefined) p.criteria = v.criteria || null
  if (v.sort_order !== undefined) p.sort_order = int(v.sort_order)
  if (v.status) p.status = v.status.toLowerCase()
  return unwrap(await supabase.from('badges').update(p).eq('id', id).select().single())
}
export const setBadgeStatus = (id, status) => updateBadge(id, { status })

export async function grantBadge(profileId, badgeId) {
  return unwrap(await supabase.from('user_badges')
    .upsert({ profile_id: profileId, badge_id: badgeId }, { onConflict: 'profile_id,badge_id', ignoreDuplicates: true })
    .select())
}

/* ---------------------------------------------------------------- profile frames */
export async function listFrames() {
  const [frames, owners] = await Promise.all([
    supabase.from('frames').select('id, name, emoji, unlock_type, unlock_value, price_coins, status, sort_order').order('sort_order').order('name'),
    supabase.from('user_frames').select('frame_id'),
  ])
  if (frames.error) throw frames.error
  if (owners.error) throw owners.error
  const counts = {}
  for (const r of owners.data) counts[r.frame_id] = (counts[r.frame_id] || 0) + 1
  return frames.data.map((f) => ({
    id: f.id, idShort: shortId(f.id),
    name: f.name, emoji: f.emoji || '💫',
    unlockType: titleCase(f.unlock_type),
    unlockValue: f.unlock_value || 0,
    unlock: unlockLabel(f.unlock_type, f.unlock_value),
    price: f.price_coins || 0,
    owners: counts[f.id] || 0,
    sortOrder: f.sort_order || 0,
    status: titleCase(f.status),
  }))
}
export async function createFrame(v) {
  return unwrap(await supabase.from('frames').insert({
    name: v.name,
    emoji: v.emoji || '💫',
    unlock_type: (v.unlock_type || 'free').toLowerCase(),
    unlock_value: int(v.unlock_value),
    price_coins: int(v.price_coins),
    sort_order: int(v.sort_order),
    status: (v.status || 'active').toLowerCase(),
  }).select().single())
}
export async function updateFrame(id, v) {
  const p = {}
  if (v.name != null) p.name = v.name
  if (v.emoji != null) p.emoji = v.emoji
  if (v.unlock_type) p.unlock_type = v.unlock_type.toLowerCase()
  if (v.unlock_value !== undefined) p.unlock_value = int(v.unlock_value)
  if (v.price_coins !== undefined) p.price_coins = int(v.price_coins)
  if (v.sort_order !== undefined) p.sort_order = int(v.sort_order)
  if (v.status) p.status = v.status.toLowerCase()
  return unwrap(await supabase.from('frames').update(p).eq('id', id).select().single())
}
export const setFrameStatus = (id, status) => updateFrame(id, { status })

/* ---------------------------------------------------------------- leaderboard frames */
export async function listLeaderboardFrames() {
  const rows = unwrap(await supabase.from('leaderboard_frames')
    .select('id, name, emoji, scope, period, status').order('name'))
  return rows.map((f) => ({
    id: f.id, idShort: shortId(f.id),
    name: f.name, emoji: f.emoji || '🏆',
    scope: titleCase(f.scope),
    period: titleCase(f.period),
    status: titleCase(f.status),
  }))
}
export async function createLeaderboardFrame(v) {
  return unwrap(await supabase.from('leaderboard_frames').insert({
    name: v.name,
    emoji: v.emoji || '🏆',
    scope: (v.scope || 'global').toLowerCase(),
    period: (v.period || 'weekly').toLowerCase(),
    status: (v.status || 'active').toLowerCase(),
  }).select().single())
}
export async function updateLeaderboardFrame(id, v) {
  const p = {}
  if (v.name != null) p.name = v.name
  if (v.emoji != null) p.emoji = v.emoji
  if (v.scope) p.scope = v.scope.toLowerCase()
  if (v.period) p.period = v.period.toLowerCase()
  if (v.status) p.status = v.status.toLowerCase()
  return unwrap(await supabase.from('leaderboard_frames').update(p).eq('id', id).select().single())
}
export const setLeaderboardFrameStatus = (id, status) => updateLeaderboardFrame(id, { status })
