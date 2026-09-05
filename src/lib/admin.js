import { supabase } from './supabase.js'

/* ---------------------------------------------------------------- helpers */
const unwrap = ({ data, error }) => { if (error) throw error; return data }
export const shortId = (uuid) => (uuid ? uuid.slice(0, 8) : '')
export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const titleCase = (s) =>
  s ? String(s).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s
export const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin', sub_admin: 'Sub Admin', agency_manager: 'Agency Manager' }

function deriveRole(row) {
  if (row.staff_roles?.role) return ROLE_LABEL[row.staff_roles.role] || row.staff_roles.role
  if (row.host_profiles) return 'Host'
  return 'User'
}

/* ---------------------------------------------------------------- USERS */
export async function listUsers() {
  const rows = unwrap(await supabase
    .from('profiles')
    .select('id, name, username, location, level, followers_count, verified, status, created_at, wallets(coins), host_profiles(tier, status, kyc_status), staff_roles(role, agency_id)')
    .order('created_at', { ascending: false })
    .limit(1000))
  return rows.map((r) => ({
    id: r.id,
    idShort: shortId(r.id),
    name: r.name,
    username: r.username,
    location: r.location,
    level: r.level,
    followers: r.followers_count,
    verified: r.verified,
    status: titleCase(r.status),
    kyc: r.host_profiles ? titleCase(r.host_profiles.kyc_status) : '—',
    role: deriveRole(r),
    isHost: !!r.host_profiles,
    isStaff: !!r.staff_roles,
    coins: r.wallets?.coins ?? 0,
    joined: fmtDate(r.created_at),
  }))
}

export async function getUserDetail(id) {
  const [profile, gifts, streams] = await Promise.all([
    supabase.from('profiles')
      .select('*, wallets(coins, diamonds), host_profiles(*, agencies(name)), staff_roles(role, agency_id, agencies(name)), kyc_verifications!profile_id(status, document_type, created_at)')
      .eq('id', id).maybeSingle().then(unwrap),
    supabase.from('gift_transactions')
      .select('coins, created_at, sender:sender_id(name), receiver:receiver_id(name)')
      .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
      .order('created_at', { ascending: false }).limit(8).then(unwrap),
    supabase.from('live_streams')
      .select('title, status, viewer_count, gift_coin_total, started_at')
      .eq('host_id', id).order('started_at', { ascending: false }).limit(8).then(unwrap),
  ])
  return { profile, gifts: gifts || [], streams: streams || [] }
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
      .select('id, name, status, country, commission_percent, created_at, manager:manager_id(name, username)')
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
    .select('user_id, role, agency_id, created_at, profiles(name, username, level), agencies(name)')
    .order('created_at', { ascending: false })
  if (roles?.length) q = q.in('role', roles)
  const rows = unwrap(await q)
  return rows.map((r) => ({
    id: r.user_id,
    idShort: shortId(r.user_id),
    name: r.profiles?.name ?? '—',
    username: r.profiles?.username,
    role: ROLE_LABEL[r.role] || r.role,
    roleRaw: r.role,
    agency: r.agencies?.name ?? '—',
    joined: fmtDate(r.created_at),
  }))
}
