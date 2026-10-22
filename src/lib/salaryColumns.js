// Salary exports (CSV / Excel) and the search keys the salary tables use. Plain data: tested in salaryColumns.test.js.
/* What the search boxes look at: name, username (search only), the app User ID, agency code and name, and the admins above the agency. */
export const SALARY_SEARCH_KEYS = ['host', 'payee', 'username', 'displayId', 'agency', 'agencyCode', 'subAdmin', 'subAdminId', 'countryAdmin', 'countryAdminId', 'globalAdmin', 'globalAdminId', 'period']
export const SALARY_SEARCH_HINT = 'Search by name, username, User ID, agency code, agency or admin…'
export const slugOf = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)

/* What the downloads contain. `type` only matters for Excel (a $ format / thousands separators); CSV gets plain numbers. All money is USD.
   User IDs are the ones the app shows (profiles.display_id), never the database id. The username is deliberately not exported. The admin columns say
   which Sub Admin, Country Admin and Global Admin the agency sits under (the Global Admin is blank until the system records it). */
export const ADMIN_COLUMNS = [
  { header: 'Sub Admin', value: (r) => r.subAdmin || '' },
  { header: 'Sub Admin ID', value: (r) => r.subAdminId ?? '' },
  { header: 'Country Admin', value: (r) => r.countryAdmin || '' },
  { header: 'Country Admin ID', value: (r) => r.countryAdminId ?? '' },
  { header: 'Global Admin', value: (r) => r.globalAdmin || '' },
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
