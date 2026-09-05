import { supabase } from './supabase.js'
import { shortId, fmtDate } from './admin.js'
import { relativeTime, dayBuckets, bucketSums, daysAgoISO, startOfMonthISO } from './format.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const titleCase = (s) => (s ? String(s).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s)

/* ---------------------------------------------------------------- the agency record */
export async function getAgency(agencyId) {
  return unwrap(await supabase.from('agencies')
    .select('*, manager:manager_id(name, username)')
    .eq('id', agencyId).maybeSingle())
}

/* ---------------------------------------------------------------- hosts in this agency */
async function agencyHostRows(agencyId) {
  return unwrap(await supabase.from('host_profiles')
    .select('profile_id, tier, rating, live_hours_total, kyc_status, status, created_at, profiles(name, username, followers_count, level, verified, wallets(coins, diamonds))')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false }))
}
export async function listAgencyHosts(agencyId) {
  const rows = await agencyHostRows(agencyId)
  return rows.map((r) => ({
    id: r.profile_id,
    idShort: shortId(r.profile_id),
    name: r.profiles?.name ?? '—',
    username: r.profiles?.username,
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

/* ---------------------------------------------------------------- dashboard */
export async function agencyDashboard(agencyId) {
  const hosts = await agencyHostRows(agencyId)
  const hostIds = hosts.map((h) => h.profile_id)

  const [liveNow, giftRows, recentLive] = await Promise.all([
    supabase.from('live_streams').select('*', { count: 'exact', head: true }).eq('status', 'live').in('host_id', hostIds.length ? hostIds : ['00000000-0000-0000-0000-000000000000']),
    hostIds.length
      ? supabase.from('gift_transactions').select('coins, created_at').in('receiver_id', hostIds).gte('created_at', daysAgoISO(30))
      : Promise.resolve({ data: [] }),
    hostIds.length
      ? supabase.from('live_streams').select('title, started_at, status, profiles(name)').in('host_id', hostIds).order('started_at', { ascending: false }).limit(6)
      : Promise.resolve({ data: [] }),
  ])

  const gifts = giftRows.data || []
  const coinsThisMonth = gifts.filter((g) => g.created_at >= startOfMonthISO()).reduce((s, g) => s + (g.coins || 0), 0)
  const totalDiamonds = hosts.reduce((s, h) => s + (h.profiles?.wallets?.diamonds || 0), 0)
  const buckets = dayBuckets(30)

  return {
    stats: [
      { key: 'My Hosts', value: String(hosts.length), icon: 'video', tile: 'tile-green' },
      { key: 'Live Now', value: String(liveNow.count ?? 0), icon: 'radio', tile: 'tile-pink' },
      { key: 'Coins Gifted (This Month)', value: coinsThisMonth.toLocaleString(), icon: 'coins', tile: 'tile-orange' },
      { key: 'Diamonds (roster)', value: totalDiamonds.toLocaleString(), icon: 'star', tile: 'tile-blue' },
    ],
    coinSeries: bucketSums(gifts, 'created_at', 'coins', buckets),
    days: buckets.map((b) => b.label),
    topHosts: [...hosts]
      .sort((a, b) => (b.profiles?.wallets?.coins || 0) - (a.profiles?.wallets?.coins || 0))
      .slice(0, 6)
      .map((h) => ({ name: h.profiles?.name || '—', coins: h.profiles?.wallets?.coins || 0, hours: Math.round(Number(h.live_hours_total) || 0) })),
    activities: (recentLive.data || []).map((l) => ({
      icon: 'radio',
      text: `**${l.profiles?.name ?? 'A host'}** ${l.status === 'live' ? 'is live' : 'streamed'} — "${l.title}"`,
      time: relativeTime(l.started_at),
    })),
  }
}

/* ---------------------------------------------------------------- host applications for this agency */
export async function listAgencyApplications(agencyId) {
  const rows = unwrap(await supabase.from('host_applications')
    .select('id, experience, followers_other_apps, status, created_at, applicant:applicant_id(name, username)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false }))
  return rows.map((r) => ({
    id: r.id,
    idShort: shortId(r.id),
    applicant: r.applicant?.name || '—',
    username: r.applicant?.username,
    experience: r.experience || '—',
    extFollowers: r.followers_other_apps || 0,
    status: titleCase(r.status),
    submitted: fmtDate(r.created_at),
  }))
}

/* ---------------------------------------------------------------- assignments for this agency's hosts */
export async function listAgencyAssignments(agencyId) {
  const hostRows = unwrap(await supabase.from('host_profiles').select('profile_id').eq('agency_id', agencyId))
  const ids = hostRows.map((h) => h.profile_id)
  if (!ids.length) return []
  const rows = unwrap(await supabase.from('assignments')
    .select('id, shift, target_hours, done_hours, status, created_at, host:host_id(name), sub_admin:sub_admin_id(name)')
    .in('host_id', ids)
    .order('created_at', { ascending: false }))
  return rows.map((r) => ({
    id: r.id,
    idShort: shortId(r.id),
    host: r.host?.name || '—',
    subAdmin: r.sub_admin?.name || '—',
    shift: titleCase(r.shift),
    target: Number(r.target_hours) || 0,
    done: Number(r.done_hours) || 0,
    status: titleCase(r.status),
  }))
}

/* ---------------------------------------------------------------- salary scoped to this agency */
export async function listAgencySalary(agencyId) {
  const rows = unwrap(await supabase.from('salary_payments')
    .select('id, role, period, base_amount, bonus_amount, deductions, net_amount, status, paid_at, created_at, payee:payee_id(name, username)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false }))
  return rows.map((r) => ({
    id: r.id,
    idShort: shortId(r.id),
    payee: r.payee?.name || '—',
    username: r.payee?.username,
    role: titleCase(r.role),
    period: r.period,
    base: Number(r.base_amount) || 0,
    bonus: Number(r.bonus_amount) || 0,
    deductions: Number(r.deductions) || 0,
    net: Number(r.net_amount) || 0,
    status: titleCase(r.status),
    paidAt: r.paid_at ? fmtDate(r.paid_at) : '—',
  }))
}

/* ---------------------------------------------------------------- sub-admins in this agency (read-only for managers) */
export async function listAgencySubAdmins(agencyId) {
  const rows = unwrap(await supabase.from('staff_roles')
    .select('user_id, created_at, profiles(name, username, status)')
    .eq('role', 'sub_admin').eq('agency_id', agencyId)
    .order('created_at', { ascending: false }))
  return rows.map((r) => ({
    id: r.user_id,
    idShort: shortId(r.user_id),
    name: r.profiles?.name || '—',
    username: r.profiles?.username,
    accountStatus: r.profiles?.status,
    granted: fmtDate(r.created_at),
  }))
}

/* ---------------------------------------------------------------- earnings (per host, diamonds -> ₹) */
export async function agencyEarnings(agencyId) {
  const hosts = await agencyHostRows(agencyId)
  const rows = hosts.map((h) => {
    const diamonds = h.profiles?.wallets?.diamonds || 0
    const gross = Math.round(diamonds * 0.6)
    return {
      id: h.profile_id,
      idShort: shortId(h.profile_id),
      host: h.profiles?.name || '—',
      username: h.profiles?.username,
      coins: h.profiles?.wallets?.coins || 0,
      diamonds,
      gross,
      status: h.status === 'banned' ? 'On Hold' : 'Cleared',
    }
  })
  return rows
}
