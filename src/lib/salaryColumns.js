// Salary exports (CSV / Excel) and the search keys the salary tables use. Plain data: tested in salaryColumns.test.js.
/* What the search boxes look at: name, username (search only), the app User ID, agency code and name, and the admins above the agency. */
export const SALARY_SEARCH_KEYS = ['host', 'payee', 'username', 'displayId', 'agency', 'agencyCode', 'agencyLabel', 'subAdmin', 'subAdminId', 'countryAdmin', 'countryAdminId', 'globalAdmin', 'globalAdminId', 'period']
export const SALARY_SEARCH_HINT = 'Search by name, username, User ID, Agency ID, agency or admin…'
export const slugOf = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)

/* What the downloads contain. `type` only matters for Excel (a $ format / thousands separators); CSV gets plain numbers. All money is USD.
   User IDs are the ones the app shows (profiles.display_id), never the database id. The username is deliberately not exported. The admin columns say
   which Sub Admin, Country Admin and Global Admin the agency sits under, each with their name AND their app User ID; an admin the system has not recorded says
   "Not assigned" (the Global Admin comes from staff_roles.global_admin_id, set by the Transfer Global page; sabalive migration 20261026100000). */
/* What a cell says when the system has not recorded that admin: a word, never an empty cell. */
export const NOT_ASSIGNED = 'Not assigned'
export const ADMIN_COLUMNS = [
  { header: 'Sub Admin', value: (r) => r.subAdmin || NOT_ASSIGNED },
  { header: 'Sub Admin ID', value: (r) => r.subAdminId ?? '' },
  { header: 'Country Admin', value: (r) => r.countryAdmin || NOT_ASSIGNED },
  { header: 'Country Admin ID', value: (r) => r.countryAdminId ?? '' },
  { header: 'Global Admin', value: (r) => r.globalAdmin || NOT_ASSIGNED },
  { header: 'Global Admin ID', value: (r) => r.globalAdminId ?? '' },
]
export const HOST_COLUMNS = [
  { header: 'Month', value: (r) => r.period },
  { header: 'User ID', value: (r) => r.displayId },
  { header: 'Name', value: (r) => r.host },
  { header: 'Agency code', value: (r) => r.agencyCode ?? '' },
  { header: 'Agency', value: (r) => r.agency },
  ...ADMIN_COLUMNS,
  { header: 'Diamonds from gifts', value: (r) => r.earned, type: 'int' },
  { header: 'Diamonds from rewards', value: (r) => r.rewards, type: 'int' },
  { header: 'Total diamonds', value: (r) => r.totalDiamonds, type: 'int' },
  { header: 'Live hours', value: (r) => r.hours },
  { header: 'Live days', value: (r) => r.days, type: 'int' },
  { header: 'Withdrawn diamonds', value: (r) => r.withdrawn, type: 'int' },
  { header: 'Available diamonds', value: (r) => r.available, type: 'int' },
  { header: 'Slab', value: (r) => r.slab || '' },
  { header: 'Payment (USD)', value: (r) => (r.payment != null ? r.payment : ''), type: 'usd' },
  { header: 'Payslip', value: (r) => (r.payslipId ? String(r.payslipStatus || '').replace('_', ' ') : '') },
  { header: 'Blocked', value: (r) => r.blocked || '' },
]
export const MONTH_COLUMNS = [
  { header: 'Month', value: (r) => r.period },
  { header: 'Month over', value: (r) => (r.ended ? 'yes' : 'no (live preview)') },
  { header: 'Hosts earning', value: (r) => r.hostsEarning, type: 'int' },
  { header: 'Diamonds from gifts', value: (r) => r.earned, type: 'int' },
  { header: 'Diamonds from rewards', value: (r) => r.rewards, type: 'int' },
  { header: 'Hosts reaching a slab', value: (r) => r.hostsWithSlab, type: 'int' },
  { header: 'Payment total (USD)', value: (r) => r.payment, type: 'usd' },
  { header: 'Payslips', value: (r) => r.payslips, type: 'int' },
  { header: 'Payslips net (USD)', value: (r) => r.payslipsUsd, type: 'usd' },
  { header: 'Paid (USD)', value: (r) => r.paidUsd, type: 'usd' },
]
/* The Payslips list (both the platform and the agency version) */
export const PAYSLIP_COLUMNS = [
  { header: 'User ID', value: (r) => r.displayId ?? '' },
  { header: 'Name', value: (r) => r.payee },
  { header: 'Agency code', value: (r) => r.agencyCode ?? '' },
  { header: 'Agency', value: (r) => r.agency || '' },
  ...ADMIN_COLUMNS,
  { header: 'Role', value: (r) => r.role },
  { header: 'Period', value: (r) => r.period },
  { header: 'Base (USD)', value: (r) => r.base, type: 'usd' },
  { header: 'Bonus (USD)', value: (r) => r.bonus, type: 'usd' },
  { header: 'Deductions (USD)', value: (r) => r.deductions, type: 'usd' },
  { header: 'Net pay (USD)', value: (r) => r.net, type: 'usd' },
  { header: 'Status', value: (r) => r.status },
  { header: 'Paid on', value: (r) => r.paidAt || '' },
]

/* The public Agency ID shown the way people read it: "20012 | India_Agency" (the same form the reference panel uses). */
export const agencyLabel = (code, name) => (code != null && code !== '' ? `${code} | ${name || ''}`.trim() : String(name || ''))

/* One entry of an agency list/picker. `search` is lower-cased text the type-to-search box looks in: the Agency ID first, then the name, then both
   together, so "20012", "india" and "20012 | in" all find it. */
export const agencyOption = (a) => ({
  value: a.id,
  label: agencyLabel(a.display_id, a.name),
  code: a.display_id ?? null,
  name: a.name || '',
  search: `${a.display_id ?? ''} ${a.name || ''} ${agencyLabel(a.display_id, a.name)}`.toLowerCase(),
})

/* One record of the salary_report RPC -> the row the tables and exports use. Pure, so the whole chain (record -> row -> search) is tested. The
   username is kept only so the search box can find a host by it; it is never shown or exported. agencyLabel is "20012 | Name". */
export const mapReportRow = (r) => ({
  id: r.host_id,
  hostId: r.host_id,
  host: r.host_name || '—',
  username: r.host_username,
  displayId: r.host_display_id,
  agencyId: r.agency_id,
  agency: r.agency_name || '—',
  agencyCode: r.agency_code ?? null,                 // the public Agency ID
  agencyLabel: agencyLabel(r.agency_code, r.agency_name),
  period: r.period,
  earned: Number(r.diamonds_earned),                 // diamonds from gifts (what the slab is measured on)
  rewards: Number(r.diamonds_rewards || 0),          // Lucky Box diamonds of the month, net of pull-backs
  totalDiamonds: Number(r.diamonds_earned) + Number(r.diamonds_rewards || 0),
  subAdmin: r.sub_admin_name || '', subAdminId: r.sub_admin_display_id ?? '',
  countryAdmin: r.country_admin_name || '', countryAdminId: r.country_admin_display_id ?? '',
  globalAdmin: r.global_admin_name || '', globalAdminId: r.global_admin_display_id ?? '',
  hours: Number(r.live_hours),
  days: Number(r.live_days),
  withdrawn: Number(r.withdrawn_diamonds),
  available: Number(r.available_diamonds),
  slabId: r.slab_id,
  slab: r.slab_name,
  payment: r.payment_usd != null ? Number(r.payment_usd) : null,
  payslipId: r.payslip_id,
  payslipStatus: r.payslip_status,
  blocked: r.blocked_reason,
})

/* ---------------------------------------------------------------- the "User" filter of the Salary tabs
   One entry per person who has a row in the table (a host in the monthly report, a payee in the payslips), found by their app User ID, name or username.
   Plain functions so they are tested: the rows already carry displayId / host or payee / username. */
export const ALL_USERS = { value: '', label: 'All users', search: 'all users' }

const userName = (r) => r.host || r.payee || '—'
const hasId = (r) => r.displayId != null && String(r.displayId).trim() !== ''

/* What identifies a person across their rows: their app User ID, else (an old row without one) their name and username. */
export const userKeyOf = (r) => (hasId(r) ? String(r.displayId).trim() : `n:${String(userName(r)).toLowerCase()}|${String(r.username || '').toLowerCase()}`)

/* The picker entries for these rows: "123456 | Name", one per person, ordered by User ID. `search` is lower-cased text the type-to-search box looks in:
   the User ID first, then the name and username, then the label, so "1234", "asha" and "1234 | as" all find the person. */
export function userOptions(rows) {
  const seen = new Map()
  for (const r of rows || []) {
    const key = userKeyOf(r)
    if (seen.has(key)) continue
    const id = hasId(r) ? String(r.displayId).trim() : ''
    const name = userName(r)
    const label = id ? `${id} | ${name}` : name
    seen.set(key, { value: key, label, search: `${id} ${name} ${r.username || ''} ${label}`.toLowerCase(), id, name })
  }
  const byId = (a, b) => {
    if (a.id && b.id) return (Number(a.id) - Number(b.id)) || a.id.localeCompare(b.id)
    if (a.id) return -1
    if (b.id) return 1
    return a.name.localeCompare(b.name)
  }
  return [...seen.values()].sort(byId).map(({ value, label, search }) => ({ value, label, search }))
}

/* The rows of one person; every row when no one is chosen. */
export const filterByUser = (rows, key) => (key ? (rows || []).filter((r) => userKeyOf(r) === key) : (rows || []))
