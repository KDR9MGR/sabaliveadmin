import { supabase } from './supabase.js'
import { shortId, fmtDate, ROLE_LABEL } from './admin.js'
import { staffEmails } from './country.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }

export const PLATFORM_ROLES = ['super_admin', 'admin', 'global_admin', 'country_admin']
export const AGENCY_ROLES = ['agency_manager', 'sub_admin']
export const ROLE_OPTS = Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))

/* ---------------------------------------------------------------- list */
export async function listStaffAccounts(roles) {
  let q = supabase.from('staff_roles')
    .select('user_id, role, agency_id, permissions, created_at, profiles!user_id(name, username, status, verified, display_id), agencies(name)')
    .order('created_at', { ascending: false })
  if (roles?.length) q = q.in('role', roles)
  const rows = unwrap(await q)
  return rows.map((r) => ({
    id: r.user_id,
    idShort: shortId(r.user_id),
    displayId: r.profiles?.display_id,
    name: r.profiles?.name || '—',
    username: r.profiles?.username,
    accountStatus: r.profiles?.status,
    verified: r.profiles?.verified,
    role: ROLE_LABEL[r.role] || r.role,
    roleRaw: r.role,
    agencyId: r.agency_id,
    agency: r.agencies?.name || '—',
    permissions: r.permissions || {},
    granted: fmtDate(r.created_at),
  }))
}

/* Per-user capability overrides (jsonb), saved through set_staff_permissions: a Super Admin may change
   any account, a Master the accounts below Master — and only switches the Master holds themselves. */
export async function setStaffPermissions(userId, permissions) {
  const { data, error } = await supabase.rpc('set_staff_permissions', { p_user_id: userId, p_permissions: permissions || {} })
  if (error) throw error
  return data
}

/* Role + current permissions of one account, for the permissions drawer. */
export async function getStaffAccess(userId) {
  const row = unwrap(await supabase.from('staff_roles').select('role, permissions').eq('user_id', userId).maybeSingle())
  if (!row) throw new Error('That account has no staff role')
  return { roleRaw: row.role, role: ROLE_LABEL[row.role] || row.role, permissions: row.permissions || {} }
}


/* Profiles that don't yet have any staff_roles row — candidates to grant. */
export async function grantableProfiles() {
  const [profiles, staff] = await Promise.all([
    supabase.from('profiles').select('id, name, username, display_id').order('name').limit(2000).then(unwrap),
    supabase.from('staff_roles').select('user_id').then(unwrap),
  ])
  const taken = new Set((staff || []).map((s) => s.user_id))
  return (profiles || [])
    .filter((p) => !taken.has(p.id))
    .map((p) => ({ value: p.id, label: `${p.name} (@${p.username}) · ID ${p.display_id}`, search: `${p.name} ${p.username} ${p.display_id}`.toLowerCase() }))
}

/* Country admins a new sub admin can be placed under (optional at creation). */
export async function countryAdminOptions() {
  const rows = unwrap(await supabase.from('staff_roles')
    .select('user_id, profiles!user_id(name, username)').eq('role', 'country_admin'))
  return rows.map((r) => ({ value: r.user_id, label: `${r.profiles?.name || shortId(r.user_id)} (@${r.profiles?.username || '—'})` }))
}

/* Master accounts, for Super Admin's "specific Master" coin-distribution lookup. */
export async function masterAccountOptions() {
  const rows = unwrap(await supabase.from('staff_roles')
    .select('user_id, profiles!user_id(name, username, display_id)')
    .eq('role', 'admin'))
  return rows.map((r) => ({
    value: r.user_id,
    label: `${r.profiles?.name || '—'} (@${r.profiles?.username || '—'}) · ID ${r.profiles?.display_id}`,
    search: `${r.profiles?.name} ${r.profiles?.username} ${r.profiles?.display_id}`.toLowerCase(),
  }))
}

/* Only 'active' agencies — one still 'pending' platform approval isn't a
   valid target for a new/changed staff account yet. */
export async function agencyOptions() {
  const rows = unwrap(await supabase.from('agencies').select('id, name').eq('status', 'active').order('name'))
  return rows.map((a) => ({ value: a.id, label: a.name }))
}

/* ---------------------------------------------------------------- mutations (all gated by is_super_admin() RLS) */
function normalize(role, agencyId) {
  const r = String(role).toLowerCase()
  // only an agency_manager is tied to exactly one agency; a sub_admin owns
  // many, so an agency is optional for them (and just becomes the first one)
  const needsAgency = r === 'agency_manager'
  return { role: r, agency_id: AGENCY_ROLES.includes(r) ? (agencyId || null) : null, needsAgency }
}

export async function grantRole({ user_id, role, agency_id }) {
  const { role: r, agency_id: aid, needsAgency } = normalize(role, agency_id)
  if (needsAgency && !aid) throw new Error('Agency-scoped roles need an agency selected')
  return unwrap(await supabase.from('staff_roles').insert({ user_id, role: r, agency_id: aid }).select().single())
}

/* Goes through update_staff_role (not a direct table write) — that RPC is
   what actually lets Master/Global/Country/Sub Admin touch an account in
   their own tree; the staff_roles RLS itself still only admits super_admin,
   same as it always has. */
export async function changeRole(user_id, { role, agency_id, country_admin_id }) {
  const { role: r, agency_id: aid, needsAgency } = normalize(role, agency_id)
  if (needsAgency && !aid) throw new Error('Agency-scoped roles need an agency selected')
  const { error } = await supabase.rpc('update_staff_role', {
    p_user_id: user_id, p_role: r, p_agency_id: aid, p_country_admin_id: country_admin_id || null,
  })
  if (error) throw error
}

/* "Lift revoke": put a revoked account straight back in the same role it was
   revoked from (restore_staff_role checks that against the audit log). */
export async function restoreRole(user_id, { role, agency_id, country_admin_id }) {
  const { error } = await supabase.rpc('restore_staff_role', {
    p_user_id: user_id, p_role: role, p_agency_id: agency_id || null, p_country_admin_id: country_admin_id || null,
  })
  if (error) throw error
}

/* Lift an agency-manager revoke: the chosen account becomes the agency's manager
   again (and an Inactive agency goes back to Active). */
export async function restoreAgencyManager(agency_id, user_id) {
  const { data, error } = await supabase.rpc('restore_agency_manager', { p_agency_id: agency_id, p_user_id: user_id })
  if (error) throw error
  return data
}

export async function revokeRole(user_id) {
  const { error } = await supabase.rpc('revoke_staff_role', { p_user_id: user_id })
  if (error) throw error
}

// Creates a brand-new login + staff_roles row via the invite-staff Edge
// Function (service_role; only a super_admin may call it). Returns
// { user_id, email, role, temp_password } — temp_password is set only when
// the server generated one.
export async function inviteStaff({ email, role, agency_id, country_admin_id, full_name, username, phone, location, password, payment_pin }) {
  const { role: r, agency_id: aid, needsAgency } = normalize(role, agency_id)
  if (needsAgency && !aid) throw new Error('Agency-scoped roles need an agency selected')
  const { data, error } = await supabase.functions.invoke('invite-staff', {
    body: {
      email: String(email || '').trim(), role: r, agency_id: aid,
      country_admin_id: r === 'sub_admin' ? (country_admin_id || null) : null,
      full_name: full_name || null, username: username || null, phone: phone || null,
      location: location || null, password: password || null, payment_pin: payment_pin || null,
    },
  })
  if (error) {
    let msg = error.message
    try { msg = (await error.context?.json())?.error || msg } catch { /* keep msg */ }
    throw new Error(msg)
  }
  return data
}

/* ---------------------------------------------------------------- Master: edit another staff account
   Profile fields go through the admin_update_staff_profile RPC (it must run as
   the caller so the username lock lets the change in); login email / password
   go through the admin-update-staff-auth Edge Function (needs the service
   role). Both are Master-only on the server. */
export async function getStaffProfile(userId) {
  const [row, emails] = await Promise.all([
    supabase.from('profiles')
      .select('name, username, phone, location, bio, avatar_url')
      .eq('id', userId).maybeSingle().then(unwrap),
    staffEmails([userId]),
  ])
  if (!row) throw new Error('Profile not found')
  return { ...row, email: emails[userId] || '' }
}

export async function updateStaffProfile(userId, { name, username, phone, location, bio, avatar_url }) {
  const { error } = await supabase.rpc('admin_update_staff_profile', {
    p_user_id: userId, p_name: name, p_username: username, p_phone: phone || '',
    p_location: location, p_bio: bio ?? '', p_avatar_url: avatar_url || null,
  })
  if (error) throw error
}

export async function updateStaffCredentials(userId, { email, password }) {
  const { error } = await supabase.functions.invoke('admin-update-staff-auth', {
    body: { user_id: userId, email: email || undefined, password: password || undefined },
  })
  if (error) {
    let msg = error.message
    try { msg = (await error.context?.json())?.error || msg } catch { /* keep msg */ }
    throw new Error(msg)
  }
}

/* Revokes the agency's manager login AND sets the agency Inactive, atomically. */
export async function revokeAgencyManager(agencyId) {
  const { data, error } = await supabase.rpc('revoke_agency_manager', { p_agency_id: agencyId })
  if (error) throw error
  return data
}

export async function superAdminCount() {
  const { count, error } = await supabase.from('staff_roles').select('*', { count: 'exact', head: true }).eq('role', 'super_admin')
  if (error) throw error
  return count ?? 0
}
