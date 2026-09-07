import { supabase } from './supabase.js'
import { shortId, fmtDate, ROLE_LABEL } from './admin.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }

export const PLATFORM_ROLES = ['super_admin', 'admin']
export const AGENCY_ROLES = ['agency_manager', 'sub_admin']
export const ROLE_OPTS = Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))

/* ---------------------------------------------------------------- list */
export async function listStaffAccounts(roles) {
  let q = supabase.from('staff_roles')
    .select('user_id, role, agency_id, permissions, created_at, profiles(name, username, status, verified), agencies(name)')
    .order('created_at', { ascending: false })
  if (roles?.length) q = q.in('role', roles)
  const rows = unwrap(await q)
  return rows.map((r) => ({
    id: r.user_id,
    idShort: shortId(r.user_id),
    name: r.profiles?.name || '—',
    username: r.profiles?.username,
    accountStatus: r.profiles?.status,
    verified: r.profiles?.verified,
    role: ROLE_LABEL[r.role] || r.role,
    roleRaw: r.role,
    agencyId: r.agency_id,
    agency: r.agencies?.name || '—',
    granted: fmtDate(r.created_at),
  }))
}

/* Profiles that don't yet have any staff_roles row — candidates to grant. */
export async function grantableProfiles() {
  const [profiles, staff] = await Promise.all([
    supabase.from('profiles').select('id, name, username').order('name').limit(2000).then(unwrap),
    supabase.from('staff_roles').select('user_id').then(unwrap),
  ])
  const taken = new Set((staff || []).map((s) => s.user_id))
  return (profiles || [])
    .filter((p) => !taken.has(p.id))
    .map((p) => ({ value: p.id, label: `${p.name} (@${p.username})` }))
}

export async function agencyOptions() {
  const rows = unwrap(await supabase.from('agencies').select('id, name').order('name'))
  return rows.map((a) => ({ value: a.id, label: a.name }))
}

/* ---------------------------------------------------------------- mutations (all gated by is_super_admin() RLS) */
function normalize(role, agencyId) {
  const r = String(role).toLowerCase()
  const needsAgency = AGENCY_ROLES.includes(r)
  return { role: r, agency_id: needsAgency ? (agencyId || null) : null, needsAgency }
}

export async function grantRole({ user_id, role, agency_id }) {
  const { role: r, agency_id: aid, needsAgency } = normalize(role, agency_id)
  if (needsAgency && !aid) throw new Error('Agency-scoped roles need an agency selected')
  return unwrap(await supabase.from('staff_roles').insert({ user_id, role: r, agency_id: aid }).select().single())
}

export async function changeRole(user_id, { role, agency_id }) {
  const { role: r, agency_id: aid, needsAgency } = normalize(role, agency_id)
  if (needsAgency && !aid) throw new Error('Agency-scoped roles need an agency selected')
  return unwrap(await supabase.from('staff_roles').update({ role: r, agency_id: aid }).eq('user_id', user_id).select().single())
}

export async function revokeRole(user_id) {
  const { error } = await supabase.from('staff_roles').delete().eq('user_id', user_id)
  if (error) throw error
}

// Creates a brand-new login + staff_roles row via the invite-staff Edge
// Function (service_role; only a super_admin may call it). Returns
// { user_id, email, role, temp_password } — temp_password is set only when
// the server generated one.
export async function inviteStaff({ email, role, agency_id, full_name }) {
  const { role: r, agency_id: aid, needsAgency } = normalize(role, agency_id)
  if (needsAgency && !aid) throw new Error('Agency-scoped roles need an agency selected')
  const { data, error } = await supabase.functions.invoke('invite-staff', {
    body: { email: String(email || '').trim(), role: r, agency_id: aid, full_name: full_name || null },
  })
  if (error) {
    let msg = error.message
    try { msg = (await error.context?.json())?.error || msg } catch { /* keep msg */ }
    throw new Error(msg)
  }
  return data
}

export async function superAdminCount() {
  const { count, error } = await supabase.from('staff_roles').select('*', { count: 'exact', head: true }).eq('role', 'super_admin')
  if (error) throw error
  return count ?? 0
}
