import { supabase } from './supabase.js'

/* Maintenance mode and emergency lockdown — see sabalive migration
   20261003130000_maintenance_mode.sql. The state lives in one row; the database
   enforces it (a gate runs before every API request and answers 503
   MAINTENANCE_MODE to anyone locked out), the apps and this panel show the screen.
   Only the Super Admin can change it; the Super Admin is never locked out. */

const unwrap = ({ data, error }) => { if (error) throw error; return data }

/* What the server says right now: { status: online | upcoming | maintenance |
   lockdown, title, message, image_url, starts_at, ends_at, auto_end, lock_app,
   block_logins, lock_panel, app_session_version, admin_session_version,
   server_time }. Callable while locked. */
export async function getSystemStatus() {
  return unwrap(await supabase.rpc('get_system_status'))
}

export async function setMaintenance(f) {
  return unwrap(await supabase.rpc('set_maintenance', {
    p_enabled: true,
    p_title: f.title || null,
    p_message: f.message || null,
    p_image_url: f.imageUrl || null,
    p_starts_at: f.startsAt || null,
    p_ends_at: f.endsAt || null,
    p_auto_end: !!f.autoEnd,
    p_lock_app: f.lockApp !== false,
    p_block_logins: f.blockLogins !== false,
    p_lock_panel: !!f.lockPanel,
  }))
}

export async function endMaintenance() {
  return unwrap(await supabase.rpc('end_maintenance'))
}

export async function emergencyLockdown(message) {
  return unwrap(await supabase.rpc('emergency_lockdown', { p_message: message || null }))
}

/* Signs every app user out (their sessions end; open apps sign out at once). */
export async function logoutAllAppUsers() {
  return unwrap(await supabase.rpc('logout_all_app_users'))
}

/* Signs every panel account out — except this session, so you can't lock yourself out. */
export async function logoutAllAdmins() {
  const count = unwrap(await supabase.rpc('logout_all_admins'))
  await rememberAdminVersion() // this session stays signed in
  return count
}

/* Calls cb whenever the Super Admin changes the state. Returns an unsubscribe. */
export function subscribeSystemState(cb) {
  const channel = supabase
    .channel(`system-state-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'system_state' }, cb)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

/* Is this status locking out a panel account with this role? Lockdown locks
   everyone; maintenance locks staff only if "lock panel" is on. The Super Admin
   never. */
export function isLockedForStaff(status, role) {
  if (!status || role === 'super_admin') return false
  if (status.status === 'lockdown') return true
  return status.status === 'maintenance' && !!status.lock_panel
}

/* ---------------------------------------------------------------- clock + format */
/* How far this computer's clock is from the server's, so countdowns follow the
   server's time, not whatever this machine thinks it is. */
export const clockOffset = (status) =>
  status?.server_time ? new Date(status.server_time).getTime() - Date.now() : 0

export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const p = (n) => String(n).padStart(2, '0')
  return `${p(Math.floor(total / 3600))}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)}`
}

/* "6:30 AM", or "4 Oct, 6:30 AM" when it isn't today. */
export function formatExpected(iso, now = new Date()) {
  const d = new Date(iso)
  const clock = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay ? clock : `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${clock}`
}

/* <input type="datetime-local"> works in local time without a zone. */
export const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null)

/* ---------------------------------------------------------------- "log everyone out" */
const ADMIN_VERSION_KEY = 'admin_session_version_v1'

/* Called after a panel sign-in (and after this session ran "logout all admins"): this
   browser's session belongs to the current version, so it isn't signed out by an
   earlier "log everyone out". */
export async function rememberAdminVersion() {
  try {
    const s = await getSystemStatus()
    localStorage.setItem(ADMIN_VERSION_KEY, String(s.admin_session_version))
  } catch { /* the version is a convenience; sessions are also ended server-side */ }
}

/* True if a newer "logout all admins" has happened since this session began. */
export function adminSessionRevoked(status) {
  try {
    const stored = localStorage.getItem(ADMIN_VERSION_KEY)
    if (stored == null) { localStorage.setItem(ADMIN_VERSION_KEY, String(status.admin_session_version)); return false }
    if (Number(status.admin_session_version) > Number(stored)) {
      localStorage.setItem(ADMIN_VERSION_KEY, String(status.admin_session_version))
      return true
    }
  } catch { /* storage unavailable */ }
  return false
}
