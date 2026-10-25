import { supabase } from './supabase.js'
import { relativeTime } from './format.js'
import { BAN_DURATIONS, endsOn, fmtEnd } from './banRules.js'
import { isMissingFunction } from './dbErrors.js'

export { BAN_DURATIONS, endsOn }

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const shortId = (uuid) => (uuid ? uuid.slice(0, 8) : '')
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/* Live / ID / Device bans — see sabalive migration 20261003090000_bans_and_blocks.sql.
   The database enforces them (a banned user can't join, chat, gift or host a
   live; an ID-banned account can't sign in; a banned device is blocked for any
   account) and the app learns about a new ban over Realtime, so what is set here
   takes effect on the user's phone at once. */
export const BAN_KINDS = {
  live: {
    label: 'Live ban', short: 'Live',
    blurb: "Can't watch, host, chat, gift or take seats in a live. The rest of the app still works.",
  },
  account: {
    label: 'ID ban', short: 'ID',
    blurb: 'The account is signed out and can\'t sign in. Every device it has used is banned too, its Google / Apple / email / phone identities can\'t open a new account (even after the account is deleted), and new sign-ups from its network are blocked for 24 hours.',
  },
  device: {
    label: 'Device ban', short: 'Device',
    blurb: 'The phone(s) the user has used are blocked for any account, including after a factory reset (the app also tracks a hardware id), and their identities and network are blocked for new sign-ups as for an ID ban. Their account still works on another phone.',
  },
}
export const BAN_KIND_KEYS = Object.keys(BAN_KINDS)

/* A ban row from the database: in force right now? */
export const isBanActive = (b, now = Date.now()) =>
  !b.lifted_at && (!b.ends_at || new Date(b.ends_at).getTime() > now)

export const banState = (b, now = Date.now()) =>
  b.lifted_at ? 'Lifted' : isBanActive(b, now) ? 'Active' : 'Expired'

export const untilLabel = (b) => (b.ends_at ? fmtEnd(b.ends_at) : 'Permanent')

/* The active bans in a list of ban rows, as small display objects. */
export function activeRestrictions(rows, now = Date.now()) {
  return (rows || [])
    .filter((b) => isBanActive(b, now))
    .map((b) => ({
      kind: b.kind,
      label: BAN_KINDS[b.kind]?.short || b.kind,
      until: untilLabel(b),
      permanent: !b.ends_at,
    }))
}

/* duration: '24h' | '7d' | '30d' | 'custom' | 'permanent'; endsAt (an ISO instant) only for 'custom'. The reason is shown to the person when
   they try to sign in (ban_user_v2, sabalive migration 20261025120000). While that migration is not on the project it falls back to ban_user,
   which has only 7 days / 30 days / permanent and keeps the reason private. */
export async function banUser(userId, kinds, duration, reason, endsAt) {
  const { data, error } = await supabase.rpc('ban_user_v2', {
    p_user: userId,
    p_kinds: kinds,
    p_duration: duration,
    p_reason: reason || null,
    p_ends_at: endsAt || null,
  })
  if (!error) return data
  if (!isMissingFunction(error)) throw error
  if (duration === '24h' || duration === 'custom') {
    throw new Error('A 24 hour or custom-date ban needs the latest database update, which is not applied on this project yet.')
  }
  return unwrap(await supabase.rpc('ban_user', {
    p_user: userId,
    p_kinds: kinds,
    p_duration: duration,
    p_reason: reason || null,
  }))
}

export async function liftBan(banId, note) {
  return unwrap(await supabase.rpc('lift_ban', { p_ban_id: banId, p_note: note || null }))
}

export async function liftUserBans(userId, note, kinds) {
  return unwrap(await supabase.rpc('lift_user_bans', { p_user: userId, p_note: note || null, p_kinds: kinds?.length ? kinds : null }))
}

const PERSON = 'name, username, display_id, avatar_url'

const banRow = (b) => {
  const state = banState(b)
  return {
    id: b.id,
    idShort: shortId(b.id),
    userId: b.user_id,
    user: b.user?.name || '—',
    username: b.user?.username,
    displayId: b.user?.display_id,
    avatar: b.user?.avatar_url || null,
    kind: b.kind,
    kindLabel: BAN_KINDS[b.kind]?.label || b.kind,
    until: untilLabel(b),
    permanent: !b.ends_at,
    endsAt: b.ends_at,
    reason: b.reason || '',
    by: b.creator?.name || '—',
    liftedBy: b.lifter?.name || null,
    liftNote: b.lift_note || '',
    devices: b.banned_devices?.[0]?.count ?? 0,
    state,
    placed: fmtDate(b.created_at),
    when: relativeTime(b.created_at),
    at: b.created_at,
    raw: b,
  }
}

export async function listBans() {
  const rows = unwrap(await supabase.from('user_bans')
    .select(`id, user_id, kind, starts_at, ends_at, reason, created_at, lifted_at, lift_note,
      user:profiles!user_id(${PERSON}), creator:profiles!created_by(name), lifter:profiles!lifted_by(name),
      banned_devices(count)`)
    .order('created_at', { ascending: false })
    .limit(500))
  return rows.map(banRow)
}

export async function listUserBans(userId) {
  const rows = unwrap(await supabase.from('user_bans')
    .select(`id, user_id, kind, starts_at, ends_at, reason, created_at, lifted_at, lift_note,
      user:profiles!user_id(${PERSON}), creator:profiles!created_by(name), lifter:profiles!lifted_by(name),
      banned_devices(count)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false }))
  return rows.map(banRow)
}

/* Other accounts that share a phone, a network (IP, last 30 days) or a login identity (same email / phone number) with
   this user — see admin_linked_accounts (migration 20261015100000). Needs the "View user profile" switch. */
export async function getLinkedAccounts(userId) {
  const { data, error } = await supabase.rpc('admin_linked_accounts', { p_user: userId })
  if (error) throw error
  return (data || []).map((r) => ({
    id: r.user_id,
    key: `${r.user_id}-${r.link}-${r.detail}`,
    name: r.name || '—',
    username: r.username,
    displayId: r.display_id,
    status: r.status,
    link: r.link,
    detail: r.detail,
    banned: !!r.banned,
    seen: r.last_seen ? relativeTime(r.last_seen) : '—',
  }))
}
