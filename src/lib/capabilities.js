/* Per-user staff capabilities layered over the role.
 *
 * `staff_roles.permissions` (jsonb) holds { <key>: true|false } overrides. The
 * effective value for a key is `permissions[key] ?? ROLE_BASELINE[role][key]`.
 * super_admin is always all-true and can't be locked out.
 *
 * IMPORTANT: ROLE_BASELINE below must stay in sync with public.role_baseline()
 * in the sabalive migration 20260909110000_capability_permissions.sql — the SQL
 * copy is what the privileged RPCs enforce, this copy drives the UI. (Keys in
 * the 'Platform menu' group are UI-only and intentionally not in the SQL copy.)
 */

export const CAPABILITIES = [
  { key: 'view_dashboards', label: 'View dashboards', group: 'Overview' },
  { key: 'manage_users', label: 'Manage users', group: 'Users & staff' },
  { key: 'manage_admins', label: 'Manage admins', group: 'Users & staff' },
  { key: 'manage_agencies', label: 'Manage agencies', group: 'Operations' },
  { key: 'manage_hosts', label: 'Manage hosts', group: 'Operations' },
  { key: 'manage_coins', label: 'Configure coins & gifts', group: 'Operations' },
  { key: 'run_payroll', label: 'Run payroll', group: 'Operations' },
  { key: 'edit_config', label: 'Edit app config', group: 'System' },
  { key: 'manage_infra', label: 'Manage infrastructure', group: 'System' },
  { key: 'view_audit', label: 'Access audit logs', group: 'System' },
  { key: 'impersonate', label: 'Impersonate accounts', group: 'System' },
  { key: 'export_data', label: 'Export data', group: 'System' },
  // Master left-menu items that had no switch of their own. UI-only (menu + route
  // guard); no RPC checks them, so they are deliberately absent from the SQL
  // role_baseline() and off by default for every role until a Super Admin turns
  // them on per account.
  { key: 'view_reports', label: 'Reports & analytics', group: 'Platform menu' },
  { key: 'manage_live_requests', label: 'Live requests', group: 'Platform menu' },
  { key: 'manage_lucky_box', label: 'Lucky Box', group: 'Platform menu' },
  { key: 'manage_badges', label: 'Badge management', group: 'Platform menu' },
  { key: 'manage_leaderboard_frame', label: 'Leaderboard frame', group: 'Platform menu' },
  { key: 'manage_profile_frames', label: 'Profile frames', group: 'Platform menu' },
  { key: 'manage_content', label: 'Content / settings', group: 'Platform menu' },
  { key: 'manage_system', label: 'System management', group: 'Platform menu' },
  // Watch any live from the panel without being seen. On by default for a Master and
  // enforced server-side (staff_can_ghost_watch): an explicit false here blocks it.
  { key: 'monitor_lives', label: 'Live monitor (ghost view)', group: 'Platform menu' },
  // Also enforced server-side (staff_cap_on): on by default for a Master, an explicit false blocks.
  { key: 'manage_levels', label: 'Levels (XP & images)', group: 'Platform menu' },
  { key: 'manage_support', label: 'Support chat', group: 'Platform menu' },
]

export const CAPABILITY_KEYS = CAPABILITIES.map((c) => c.key)

const set = (...keys) => Object.fromEntries(CAPABILITY_KEYS.map((k) => [k, keys.includes(k)]))
const ALL = Object.fromEntries(CAPABILITY_KEYS.map((k) => [k, true]))

export const ROLE_BASELINE = {
  super_admin: ALL,
  admin: set('view_dashboards', 'manage_users', 'manage_agencies', 'manage_hosts', 'manage_coins', 'export_data', 'monitor_lives', 'manage_levels', 'manage_support'),
  agency_manager: set('view_dashboards', 'manage_hosts', 'export_data'),
  sub_admin: set('view_dashboards', 'manage_hosts'),
  country_admin: set('view_dashboards', 'manage_hosts'),
  global_admin: set('view_dashboards', 'manage_hosts'),
}

export function roleBaseline(roleRaw) {
  return ROLE_BASELINE[roleRaw] || set()
}

/* Effective capability map for a staff_roles row ({ role, permissions }). */
export function effectivePermissions(staffRole) {
  if (!staffRole) return set()
  if (staffRole.role === 'super_admin') return ALL
  const base = roleBaseline(staffRole.role)
  const over = staffRole.permissions || {}
  return Object.fromEntries(CAPABILITY_KEYS.map((k) => [k, typeof over[k] === 'boolean' ? over[k] : !!base[k]]))
}

export function can(staffRole, key) {
  if (!staffRole) return false
  if (staffRole.role === 'super_admin') return true
  return effectivePermissions(staffRole)[key] === true
}

/* What turning a capability ON beyond the role's default does, per role.
 *  - Master (admin): every switch works — the menu/route appears and the database already lets a Master do it.
 *  - Global / Country / Sub Admin and Agency: the switches below are wired end to end — a "Granted access" menu
 *    entry, the Master page opened for that feature only (see GRANT_PAGES), and the database allowing exactly
 *    that feature's data for that account (staff_can() + the "Granted <key>" policies, migrations
 *    20261006100000 / 20261006140000). Manage users and Run payroll are served from the account's own panel.
 *  - Platform-level switches (manage_admins, edit_config, manage_infra, manage_system, view_audit, impersonate,
 *    monitor_lives) stay Master / Super Admin only; manage_hosts and view_dashboards are already on by default.
 */
const ALL_LOWER = ['global_admin', 'country_admin', 'sub_admin', 'agency_manager']
export const LOWER_ROLE_GRANTS = {
  manage_users: { roles: ['global_admin', 'country_admin', 'sub_admin'], gives: 'Restrict / lift / set inactive on the Users page' },
  run_payroll: { roles: ALL_LOWER, gives: 'A Withdrawals page: see and approve / reject payouts' },
  manage_agencies: { roles: ALL_LOWER, gives: 'Agency Management: agencies, requests, commission plans' },
  manage_coins: { roles: ALL_LOWER, gives: 'Coin & Gift and Store pages (gifts, packages, items, Lucky IDs, transactions)' },
  manage_live_requests: { roles: ALL_LOWER, gives: 'Live Requests: review and approve go-live requests' },
  manage_levels: { roles: ALL_LOWER, gives: 'Levels (XP & images)' },
  manage_support: { roles: ALL_LOWER, gives: 'Support chat' },
  manage_lucky_box: { roles: ALL_LOWER, gives: 'Lucky Box settings' },
  manage_badges: { roles: ALL_LOWER, gives: 'Badge management' },
  manage_leaderboard_frame: { roles: ALL_LOWER, gives: 'Leaderboard frame' },
  manage_profile_frames: { roles: ALL_LOWER, gives: 'Profile frames' },
  manage_content: { roles: ALL_LOWER, gives: 'Banners, legal pages, announcements, live emojis' },
  view_reports: { roles: ALL_LOWER, gives: 'Reports & analytics' },
}

/* The Master pages (path prefixes under /admin) a granted switch opens for a lower-role account. */
export const GRANT_PAGES = {
  manage_agencies: ['/admin/agencies'],
  manage_coins: ['/admin/store', '/admin/coins/sellers', '/admin/coins/gifts', '/admin/coins/packages', '/admin/coins/transactions', '/admin/coins/gift-history'],
  manage_live_requests: ['/admin/live'],
  manage_levels: ['/admin/levels'],
  manage_support: ['/admin/support'],
  manage_lucky_box: ['/admin/lucky-box'],
  manage_badges: ['/admin/badges'],
  manage_leaderboard_frame: ['/admin/leaderboard'],
  manage_profile_frames: ['/admin/frames'],
  manage_content: ['/admin/content'],
  view_reports: ['/admin/reports'],
}

const isMasterOrAbove = (roleRaw) => roleRaw === 'admin' || roleRaw === 'super_admin'

/* Can switching `key` ON for an account with this role have any effect? */
export function canGrant(roleRaw, key) {
  if (isMasterOrAbove(roleRaw)) return true
  return !!LOWER_ROLE_GRANTS[key]?.roles.includes(roleRaw)
}

/* Does this lower-role account hold an explicit grant for `key` that is wired for its role? */
export function hasGrant(staffRole, key) {
  if (!staffRole || isMasterOrAbove(staffRole.role)) return false
  return staffRole.permissions?.[key] === true && !!LOWER_ROLE_GRANTS[key]?.roles.includes(staffRole.role)
}

const underPrefix = (pathname, prefix) => pathname === prefix || pathname.startsWith(prefix + '/')

/* May a lower-role account open this /admin path (a Master page one of its grants unlocks)? */
export function grantedPathAllowed(staffRole, pathname) {
  if (!staffRole || isMasterOrAbove(staffRole.role)) return false
  return Object.entries(GRANT_PAGES).some(([key, prefixes]) => hasGrant(staffRole, key) && prefixes.some((p) => underPrefix(pathname, p)))
}
