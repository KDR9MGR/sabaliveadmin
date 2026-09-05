import { supabase } from './supabase.js'
import { dayBuckets, bucketCounts, bucketSums, startOfMonthISO, daysAgoISO, relativeTime } from './format.js'

const count = async (table, build) => {
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (build) q = build(q)
  const { count: n, error } = await q
  if (error) throw error
  return n ?? 0
}

/* growth() -> null when there's no meaningful previous-period baseline to compare against
   (avoids showing a nonsense "+400%" when a metric goes from 1 to 5 on a near-empty table). */
function growth(current, previous) {
  if (!previous) return null
  const pct = ((current - previous) / previous) * 100
  return { delta: Math.abs(Math.round(pct * 10) / 10), dir: pct >= 0 ? 'up' : 'down' }
}

async function statWithGrowth(table, build) {
  const now = await count(table, build)
  const prev = await count(table, (q) => {
    q = build ? build(q) : q
    return q.lt('created_at', daysAgoISO(30)).gte('created_at', daysAgoISO(60))
  })
  const cur30 = now - await count(table, (q) => (build ? build(q) : q).lt('created_at', daysAgoISO(30)))
  return { total: now, ...growth(cur30, prev) }
}

export async function fetchMasterDashboard() {
  const buckets = dayBuckets(30)

  const [
    totalUsers, totalHosts, totalAgencies, activeLive,
    giftRows, liveStartRows,
    subAdminsCount, staffCount,
    recentProfiles, recentHosts, recentLive, recentGifts, recentAgencies,
    topAgenciesRaw, recentAudit,
  ] = await Promise.all([
    statWithGrowth('profiles'),
    statWithGrowth('host_profiles'),
    statWithGrowth('agencies'),
    count('live_streams', (q) => q.eq('status', 'live')),
    supabase.from('gift_transactions').select('coins, created_at').gte('created_at', daysAgoISO(30)),
    supabase.from('live_streams').select('started_at').gte('started_at', daysAgoISO(30)),
    count('staff_roles', (q) => q.eq('role', 'sub_admin')),
    count('staff_roles', (q) => q.in('role', ['admin', 'super_admin', 'agency_manager'])),
    supabase.from('profiles').select('id, name, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('host_profiles').select('created_at, profiles(name), agencies(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('live_streams').select('title, started_at, profiles(name)').order('started_at', { ascending: false }).limit(5),
    supabase.from('gift_transactions').select('coins, created_at, sender:sender_id(name), receiver:receiver_id(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('agencies').select('id, name, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('agencies').select('id, name, commission_percent, status'),
    supabase.from('audit_logs').select('id, action, target, severity, created_at, profiles(name)').order('created_at', { ascending: false }).limit(6),
  ])

  const gifts = giftRows.data || []
  const giftsThisMonth = gifts
    .filter((g) => g.created_at >= startOfMonthISO())
    .reduce((s, g) => s + (g.coins || 0), 0)

  const hostsCount = totalHosts.total
  const plainUsers = Math.max(0, totalUsers.total - hostsCount - subAdminsCount - staffCount)

  // Top agencies ranked by coins gifted to their hosts (client-aggregated: both tables are small right now)
  const agencies = topAgenciesRaw.data || []
  let topAgencies = []
  if (agencies.length) {
    const [{ data: hosts }, { data: allGifts }] = await Promise.all([
      supabase.from('host_profiles').select('profile_id, agency_id'),
      supabase.from('gift_transactions').select('receiver_id, coins'),
    ])
    const hostToAgency = new Map((hosts || []).map((h) => [h.profile_id, h.agency_id]))
    const revenueByAgency = new Map()
    const hostCountByAgency = new Map()
    for (const h of hosts || []) {
      if (!h.agency_id) continue
      hostCountByAgency.set(h.agency_id, (hostCountByAgency.get(h.agency_id) || 0) + 1)
    }
    for (const g of allGifts || []) {
      const agencyId = hostToAgency.get(g.receiver_id)
      if (!agencyId) continue
      revenueByAgency.set(agencyId, (revenueByAgency.get(agencyId) || 0) + (g.coins || 0))
    }
    topAgencies = agencies
      .map((a) => ({
        name: a.name,
        status: a.status,
        commission: a.commission_percent,
        hosts: hostCountByAgency.get(a.id) || 0,
        revenue: revenueByAgency.get(a.id) || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }

  // Recent activity — merge real events from several tables into one feed
  const activities = [
    ...(recentProfiles.data || []).map((p) => ({
      icon: 'userPlus', at: p.created_at,
      text: `New user **${p.name}** registered`,
    })),
    ...(recentHosts.data || []).map((h) => ({
      icon: 'video', at: h.created_at,
      text: `**${h.profiles?.name ?? 'A host'}** joined${h.agencies?.name ? ` **${h.agencies.name}**` : ' as an independent host'}`,
    })),
    ...(recentLive.data || []).map((l) => ({
      icon: 'radio', at: l.started_at,
      text: `**${l.profiles?.name ?? 'A host'}** went live — "${l.title}"`,
    })),
    ...(recentGifts.data || []).map((g) => ({
      icon: 'gift', at: g.created_at,
      text: `**${g.coins}** coins gifted — **${g.sender?.name ?? 'someone'}** → **${g.receiver?.name ?? 'someone'}**`,
    })),
    ...(recentAgencies.data || []).map((a) => ({
      icon: 'building', at: a.created_at,
      text: `Agency **${a.name}** created`,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6)
    .map((a) => ({ ...a, time: relativeTime(a.at) }))

  return {
    stats: [
      { key: 'Total Users', value: totalUsers.total.toLocaleString(), delta: totalUsers.delta, dir: totalUsers.dir, icon: 'users', tile: 'tile-purple' },
      { key: 'Total Hosts', value: totalHosts.total.toLocaleString(), delta: totalHosts.delta, dir: totalHosts.dir, icon: 'video', tile: 'tile-green' },
      { key: 'Total Agencies', value: totalAgencies.total.toLocaleString(), delta: totalAgencies.delta, dir: totalAgencies.dir, icon: 'building', tile: 'tile-orange' },
      { key: 'Coins Gifted (This Month)', value: giftsThisMonth.toLocaleString(), icon: 'gift', tile: 'tile-blue' },
      { key: 'Active Live Rooms', value: String(activeLive), icon: 'radio', tile: 'tile-pink' },
    ],
    userSplit: [
      { label: 'Users', value: plainUsers, color: '#7c3aed' },
      { label: 'Hosts', value: hostsCount, color: '#f59e0b' },
      { label: 'Sub Admins', value: subAdminsCount, color: '#3b82f6' },
      { label: 'Admins & Managers', value: staffCount, color: '#22a06b' },
    ],
    liveSeries: bucketCounts(liveStartRows.data || [], 'started_at', buckets),
    revenueSeries: bucketSums(gifts, 'created_at', 'coins', buckets),
    days: buckets.map((b) => b.label),
    topAgencies,
    activities,
    auditRecent: (recentAudit.data || []).map((a) => ({
      text: `${a.profiles?.name ?? 'System'} — ${a.action}${a.target ? ` (${a.target})` : ''}`,
      time: relativeTime(a.created_at),
      severity: a.severity,
    })),
  }
}
