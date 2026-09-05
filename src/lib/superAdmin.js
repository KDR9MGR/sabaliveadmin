import { supabase } from './supabase.js'
import { shortId, fmtDate, ROLE_LABEL } from './admin.js'
import { relativeTime, daysAgoISO } from './format.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const titleCase = (s) => (s ? String(s).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s)

const countOf = async (table, build) => {
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (build) q = build(q)
  const { count, error } = await q
  if (error) throw error
  return count ?? 0
}

/* ---------------------------------------------------------------- dashboard */
export async function superDashboard() {
  const [
    users, hosts, agencies, staff, liveNow,
    pendingWithdrawals, pendingApps, pendingTransfers,
    wallets, recentAudit, recentSignups,
  ] = await Promise.all([
    countOf('profiles'),
    countOf('host_profiles'),
    countOf('agencies'),
    countOf('staff_roles'),
    countOf('live_streams', (q) => q.eq('status', 'live')),
    countOf('withdrawals', (q) => q.eq('status', 'pending')),
    countOf('host_applications', (q) => q.eq('status', 'pending')),
    countOf('transfer_requests', (q) => q.eq('status', 'pending')),
    supabase.from('wallets').select('coins, diamonds').limit(5000),
    supabase.from('audit_logs').select('id, action, target, severity, created_at, profiles(name)').order('created_at', { ascending: false }).limit(6),
    supabase.from('profiles').select('id, name, username, created_at').order('created_at', { ascending: false }).limit(6),
  ])

  const w = wallets.data || []
  const coins = w.reduce((s, x) => s + Number(x.coins || 0), 0)
  const diamonds = w.reduce((s, x) => s + Number(x.diamonds || 0), 0)

  return {
    stats: [
      { key: 'Total Users', value: users.toLocaleString(), icon: 'users', tile: 'tile-purple' },
      { key: 'Hosts', value: hosts.toLocaleString(), icon: 'video', tile: 'tile-green' },
      { key: 'Agencies', value: agencies.toLocaleString(), icon: 'building', tile: 'tile-orange' },
      { key: 'Staff Accounts', value: staff.toLocaleString(), icon: 'shield', tile: 'tile-blue' },
      { key: 'Live Now', value: liveNow.toLocaleString(), icon: 'radio', tile: 'tile-pink' },
    ],
    circulation: { coins, diamonds },
    queues: [
      { label: 'Pending withdrawals', value: pendingWithdrawals, to: '/admin/withdrawals', icon: 'wallet' },
      { label: 'Host applications', value: pendingApps, to: '/admin/hosts/applications', icon: 'userPlus' },
      { label: 'Transfer requests', value: pendingTransfers, to: '/admin/users/transfers', icon: 'arrowLeftRight' },
    ],
    audit: (recentAudit.data || []).map((a) => ({
      text: `${a.profiles?.name ?? 'System'} — ${a.action}${a.target ? ` (${a.target})` : ''}`,
      time: relativeTime(a.created_at),
      severity: a.severity,
    })),
    signups: (recentSignups.data || []).map((p) => ({
      name: p.name, username: p.username, when: relativeTime(p.created_at),
    })),
  }
}

/* ---------------------------------------------------------------- audit logs */
export async function listAuditLogs() {
  const rows = unwrap(await supabase.from('audit_logs')
    .select('id, action, target, ip, severity, created_at, profiles(name, username)')
    .order('created_at', { ascending: false })
    .limit(1000))
  return rows.map((r) => ({
    id: r.id,
    idShort: String(r.id),
    actor: r.profiles?.name || 'System',
    username: r.profiles?.username,
    action: r.action,
    target: r.target || '—',
    ip: r.ip || '—',
    severity: titleCase(r.severity),
    when: fmtDate(r.created_at),
    ago: relativeTime(r.created_at),
  }))
}

/* ---------------------------------------------------------------- security overview */
export async function securityOverview() {
  const [staff, criticalAudit, weekAuditCount] = await Promise.all([
    supabase.from('staff_roles')
      .select('user_id, role, agency_id, created_at, profiles(name, username, status), agencies(name)')
      .order('created_at', { ascending: false }).then(unwrap),
    supabase.from('audit_logs')
      .select('id, action, target, severity, created_at, profiles(name)')
      .in('severity', ['warning', 'critical'])
      .order('created_at', { ascending: false }).limit(10).then(unwrap),
    countOf('audit_logs', (q) => q.gte('created_at', daysAgoISO(7))),
  ])

  return {
    staff: (staff || []).map((r) => ({
      id: r.user_id,
      idShort: shortId(r.user_id),
      name: r.profiles?.name || '—',
      username: r.profiles?.username,
      role: ROLE_LABEL[r.role] || r.role,
      agency: r.agencies?.name || '—',
      accountStatus: r.profiles?.status,
      granted: fmtDate(r.created_at),
    })),
    flagged: (criticalAudit || []).map((a) => ({
      text: `${a.profiles?.name ?? 'System'} — ${a.action}${a.target ? ` (${a.target})` : ''}`,
      severity: titleCase(a.severity),
      time: relativeTime(a.created_at),
    })),
    weekAuditCount: weekAuditCount,
  }
}

/* ---------------------------------------------------------------- system pulse (real "today" activity) */
export async function systemPulse() {
  const since = daysAgoISO(1)
  const [
    signups24h, streams24h, gifts24h, purchases24h,
    liveNow, pendingWithdrawals, openApplications,
  ] = await Promise.all([
    countOf('profiles', (q) => q.gte('created_at', since)),
    countOf('live_streams', (q) => q.gte('started_at', since)),
    countOf('gift_transactions', (q) => q.gte('created_at', since)),
    countOf('coin_purchases', (q) => q.gte('created_at', since)),
    countOf('live_streams', (q) => q.eq('status', 'live')),
    countOf('withdrawals', (q) => q.eq('status', 'pending')),
    countOf('host_applications', (q) => q.in('status', ['pending', 'under_review'])),
  ])
  return {
    metrics: [
      { key: 'New signups (24h)', value: signups24h, icon: 'userPlus', tile: 'tile-purple' },
      { key: 'Streams started (24h)', value: streams24h, icon: 'radio', tile: 'tile-pink' },
      { key: 'Gifts sent (24h)', value: gifts24h, icon: 'gift', tile: 'tile-orange' },
      { key: 'Coin purchases (24h)', value: purchases24h, icon: 'coins', tile: 'tile-green' },
      { key: 'Live rooms now', value: liveNow, icon: 'video', tile: 'tile-blue' },
      { key: 'Open host applications', value: openApplications, icon: 'userCheck', tile: 'tile-purple' },
      { key: 'Withdrawals awaiting review', value: pendingWithdrawals, icon: 'wallet', tile: 'tile-red' },
    ],
  }
}
