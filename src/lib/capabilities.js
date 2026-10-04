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
