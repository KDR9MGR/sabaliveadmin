import { supabase } from './supabase.js'
import { activeRestrictions } from './bans.js'

/* ---------------------------------------------------------------- helpers */
const unwrap = ({ data, error }) => { if (error) throw error; return data }
export const shortId = (uuid) => (uuid ? uuid.slice(0, 8) : '')
export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const titleCase = (s) =>
  s ? String(s).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s
export const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin', global_admin: 'Global Admin', country_admin: 'Country Admin', sub_admin: 'Sub Admin', agency_manager: 'Agency Manager' }

/* What the app is actually enforcing on a profile row that embedded its bans:
   the active Live / ID / Device bans, and whether it is under any restriction. */
const restrictionFields = (r) => {
  const restrictions = activeRestrictions(r.user_bans)
  return {
    restrictions,
    restricted: restrictions.length > 0 || r.status === 'suspended',
    // can't go live: suspended, ID-banned or live-banned
    liveBlocked: r.status === 'suspended' || restrictions.some((x) => x.kind === 'live' || x.kind === 'account'),
  }
}

/* ---------------------------------------------------------------- USERS */
/* Staff/panel accounts have a profiles row too but aren't app users —
   excluded here so "All Users" only ever lists real app users, not just
   filterable down to them. */
export async function listUsers() {
  const staffIds = unwrap(await supabase.from('staff_roles').select('user_id')).map((s) => s.user_id)
  const cols = 'id, display_id, name, username, location, level, followers_count, verified, status, is_live, avatar_url, created_at, wallets(coins), host_profiles(tier, status, kyc_status, agencies(name))'
  const run = (select) => {
    // ghost IDs (monitoring accounts) are managed under Super Admin → Ghost IDs, not here
    let q = supabase.from('profiles').select(select).eq('is_ghost', false).order('created_at', { ascending: false }).limit(1000)
    if (staffIds.length) q = q.not('id', 'in', `(${staffIds.join(',')})`)
    return q
  }
  let rows
  try {
    rows = unwrap(await run(`${cols}, user_bans!user_id(kind, ends_at, lifted_at)`))
  } catch (e) {
    // Before the bans migration is applied there is no user_bans relationship;
    // the list should still load (just without restrictions) rather than break.
    if (!/user_bans/.test(e?.message || '')) throw e
    rows = unwrap(await run(cols))
  }
  return rows.map((r) => ({
    ...restrictionFields(r),
    id: r.id,
    idShort: shortId(r.id),
    displayId: r.display_id,
    name: r.name,
    username: r.username,
    avatar: r.avatar_url || null,
    location: r.location,
    level: r.level,
    followers: r.followers_count,
    verified: r.verified,
    status: titleCase(r.status),
    isLive: !!r.is_live,
    kyc: r.host_profiles ? titleCase(r.host_profiles.kyc_status) : '—',
    role: r.host_profiles ? 'Host' : 'User',
    isHost: !!r.host_profiles,
    agency: r.host_profiles?.agencies?.name || '—',
    coins: r.wallets?.coins ?? 0,
    joined: fmtDate(r.created_at),
  }))
}

export async function getUserDetail(id) {
  const [profile, entries, streams, badges, frames, following, followers, login] = await Promise.all([
    supabase.from('profiles')
      .select('*, wallets(coins, diamonds), host_profiles(*, agencies(name)), staff_roles!user_id(role, agency_id, agencies(name)), kyc_verifications!profile_id(status, document_type, created_at)')
      .eq('id', id).maybeSingle().then(unwrap),
    // the entry effects and vehicles this user has bought (and is wearing)
    supabase.from('user_items')
      .select('expires_at, equipped, purchased_at, store_items(name, emoji, category, asset_url)')
      .eq('profile_id', id).order('purchased_at', { ascending: false }).limit(50).then(unwrap),
    supabase.from('live_streams')
      .select('title, status, viewer_count, gift_coin_total, started_at')
      .eq('host_id', id).order('started_at', { ascending: false }).limit(8).then(unwrap),
    supabase.from('user_badges')
      .select('awarded_at, badges(id, name, emoji, criteria)')
      .eq('profile_id', id).order('awarded_at', { ascending: false }).then(unwrap),
    supabase.from('user_frames')
      .select('equipped, acquired_at, frames(id, name, emoji, unlock_type)')
      .eq('profile_id', id).order('acquired_at', { ascending: false }).then(unwrap),
    supabase.from('follows')
      .select('followee:followee_id(id, name, username)')
      .eq('follower_id', id).limit(50).then(unwrap),
    supabase.from('follows')
      .select('follower:follower_id(id, name, username)')
      .eq('followee_id', id).limit(50).then(unwrap),
    // how they sign in, and from which devices (RPC from migration 20261003120000;
    // the page still loads without it)
    supabase.rpc('admin_user_login_info', { p_user: id }).then(({ data, error }) => (error ? null : data)),
  ])
  return {
    profile,
    entries: (entries || [])
      .filter((e) => e.store_items && ['entry_effect', 'vehicle'].includes(e.store_items.category))
      .map((e) => ({
        name: e.store_items.name,
        emoji: e.store_items.emoji,
        kind: e.store_items.category === 'vehicle' ? 'Vehicle' : 'Entry effect',
        assetUrl: e.store_items.asset_url,
        equipped: e.equipped,
        expiresAt: e.expires_at,
        purchasedAt: e.purchased_at,
        active: new Date(e.expires_at).getTime() > Date.now(),
      })),
    login: login || null,
    streams: streams || [],
    badges: badges || [],
    frames: frames || [],
    following: (following || []).map((f) => f.followee).filter(Boolean),
    followers: (followers || []).map((f) => f.follower).filter(Boolean),
  }
}

export async function setUserStatus(id, status) {
  return unwrap(await supabase.rpc('set_profile_status', { p_profile_id: id, p_status: status }))
}

/* ---------------------------------------------------------------- HOSTS */
export async function listHosts() {
  const rows = unwrap(await supabase
    .from('host_profiles')
    .select('profile_id, tier, rating, live_hours_total, kyc_status, status, created_at, agencies(name), profiles(name, username, followers_count, level, verified, wallets(coins, diamonds))')
    .order('created_at', { ascending: false })
    .limit(1000))
  return rows.map((r) => ({
    id: r.profile_id,
    idShort: shortId(r.profile_id),
    name: r.profiles?.name ?? '—',
    username: r.profiles?.username,
    agency: r.agencies?.name ?? 'Independent',
    tier: titleCase(r.tier),
    rating: Number(r.rating).toFixed(1),
    followers: r.profiles?.followers_count ?? 0,
    coins: r.profiles?.wallets?.coins ?? 0,
    diamonds: r.profiles?.wallets?.diamonds ?? 0,
    liveHours: Math.round(Number(r.live_hours_total) || 0),
    kyc: titleCase(r.kyc_status),
    status: titleCase(r.status),
    joined: fmtDate(r.created_at),
  }))
}

export async function getHostDetail(id) {
  const [host, streams, gifts] = await Promise.all([
    supabase.from('host_profiles')
      .select('*, agencies(id, name), profiles(name, username, bio, location, level, followers_count, following_count, verified, created_at, wallets(coins, diamonds))')
      .eq('profile_id', id).maybeSingle().then(unwrap),
    supabase.from('live_streams')
      .select('title, status, viewer_count, like_count, gift_coin_total, started_at, ended_at')
      .eq('host_id', id).order('started_at', { ascending: false }).limit(10).then(unwrap),
    supabase.from('gift_transactions')
      .select('coins, created_at, sender:sender_id(name)')
      .eq('receiver_id', id).order('created_at', { ascending: false }).limit(10).then(unwrap),
  ])
  return { host, streams: streams || [], gifts: gifts || [] }
}

const lc = (patch, keys) => {
  const out = { ...patch }
  for (const k of keys) if (typeof out[k] === 'string') out[k] = out[k].toLowerCase()
  return out
}

export async function updateHost(id, patch) {
  return unwrap(await supabase.from('host_profiles')
    .update(lc(patch, ['tier', 'status', 'kyc_status'])).eq('profile_id', id).select().maybeSingle())
}

/* ---------------------------------------------------------------- AGENCIES */
export async function listAgencies() {
  const [agencies, hostRows] = await Promise.all([
    supabase.from('agencies')
      .select('id, display_id, name, status, country, commission_percent, created_at, manager:manager_id(name, username)')
      .order('created_at', { ascending: false }).limit(1000).then(unwrap),
    supabase.from('host_profiles').select('agency_id').then(unwrap),
  ])
  const hostCount = new Map()
  for (const h of hostRows || []) {
    if (h.agency_id) hostCount.set(h.agency_id, (hostCount.get(h.agency_id) || 0) + 1)
  }
  return (agencies || []).map((a) => ({
    id: a.id,
    idShort: shortId(a.id),
    displayId: a.display_id,
    name: a.name,
    manager: a.manager?.name ?? 'Unassigned',
    country: a.country,
    commission: a.commission_percent,
    status: titleCase(a.status),
    hosts: hostCount.get(a.id) || 0,
    joined: fmtDate(a.created_at),
  }))
}

export async function getAgencyDetail(id) {
  const [agency, hosts] = await Promise.all([
    supabase.from('agencies')
      .select('*, manager:manager_id(name, username)')
      .eq('id', id).maybeSingle().then(unwrap),
    supabase.from('host_profiles')
      .select('profile_id, tier, rating, status, live_hours_total, created_at, profiles(name, username, followers_count, wallets(coins, diamonds))')
      .eq('agency_id', id).order('created_at', { ascending: false }).then(unwrap),
  ])
  return {
    agency,
    hosts: (hosts || []).map((h) => ({
      id: h.profile_id,
      idShort: shortId(h.profile_id),
      name: h.profiles?.name ?? '—',
      tier: titleCase(h.tier),
      rating: Number(h.rating).toFixed(1),
      followers: h.profiles?.followers_count ?? 0,
      coins: h.profiles?.wallets?.coins ?? 0,
      liveHours: Math.round(Number(h.live_hours_total) || 0),
      status: titleCase(h.status),
      joined: fmtDate(h.created_at),
    })),
  }
}

export async function createAgency({ name, commission_percent, status, country }) {
  return unwrap(await supabase.from('agencies').insert({
    name,
    commission_percent: commission_percent === '' || commission_percent == null ? 10 : Number(commission_percent),
    status: (status || 'pending').toLowerCase(),
    country: country || 'India',
  }).select().single())
}

export async function updateAgency(id, patch) {
  const clean = lc(patch, ['status'])
  if (clean.commission_percent != null && clean.commission_percent !== '') clean.commission_percent = Number(clean.commission_percent)
  else delete clean.commission_percent
  return unwrap(await supabase.from('agencies').update(clean).eq('id', id).select().single())
}

export async function deleteAgency(id) {
  const { error } = await supabase.from('agencies').delete().eq('id', id)
  if (error) throw error
}

/* ---------------------------------------------------------------- STAFF (admins / sub admins) */
export async function listStaff(roles) {
  let q = supabase.from('staff_roles')
    .select('user_id, role, agency_id, created_at, profiles!user_id(name, username, level, display_id), agencies(name)')
    .order('created_at', { ascending: false })
  if (roles?.length) q = q.in('role', roles)
  const rows = unwrap(await q)
  return rows.map((r) => ({
    id: r.user_id,
    idShort: shortId(r.user_id),
    displayId: r.profiles?.display_id,
    name: r.profiles?.name ?? '—',
    username: r.profiles?.username,
    role: ROLE_LABEL[r.role] || r.role,
    roleRaw: r.role,
    agency: r.agencies?.name ?? '—',
    joined: fmtDate(r.created_at),
  }))
}
