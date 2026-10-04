import { supabase } from './supabase.js'
import { relativeTime } from './format.js'

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
    blurb: 'The account is signed out and can\'t sign in on any device. Every device it has used is banned too.',
  },
  device: {
    label: 'Device ban', short: 'Device',
    blurb: 'The phone(s) the user has used are blocked for any account. Their account still works on another phone.',
  },
}
export const BAN_KIND_KEYS = Object.keys(BAN_KINDS)

export const BAN_DURATIONS = [
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
  { value: 'permanent', label: 'Permanent' },
]

/* A ban row from the database: in force right now? */
export const isBanActive = (b, now = Date.now()) =>
  !b.lifted_at && (!b.ends_at || new Date(b.ends_at).getTime() > now)

export const banState = (b, now = Date.now()) =>
  b.lifted_at ? 'Lifted' : isBanActive(b, now) ? 'Active' : 'Expired'

export const untilLabel = (b) => (b.ends_at ? fmtDate(b.ends_at) : 'Permanent')

/* The end date a duration would give, for the dialog's preview. */
export function endsOn(duration, now = new Date()) {
  const d = BAN_DURATIONS.find((x) => x.value === duration)
  if (!d?.days) return 'Never — until you lift it'
  return fmtDate(new Date(now.getTime() + d.days * 86400000).toISOString())
}

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

export async function banUser(userId, kinds, duration, reason) {
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
