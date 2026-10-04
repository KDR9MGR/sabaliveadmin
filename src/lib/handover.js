import { supabase } from './supabase.js'
import { ROLE_LABEL } from './admin.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }

/* Master → User Management → Transfer pages: hand a panel account's seat to another
   existing user. The user takes the staff role and everything the old account owned
   (sub admins / agencies under it, its coin balance); the old account becomes an
   ordinary user. See master_handover_staff_seat (sabalive migration 20261004150000). */
export const HANDOVER_ROLES = {
  agency_manager: 'Agency',
  sub_admin: 'Sub Admin',
  country_admin: 'Country Admin',
  global_admin: 'Global Admin',
}

const option = (id, p) => ({
  value: id,
  label: `${p?.name || '—'} (@${p?.username || '—'}) · ID ${p?.display_id ?? '—'}`,
  search: `${p?.name || ''} ${p?.username || ''} ${p?.display_id ?? ''}`.toLowerCase(),
})

/* The accounts holding a seat of this role. */
export async function listSeatHolders(role) {
  const rows = unwrap(await supabase.from('staff_roles')
    .select('user_id, agencies(name), profiles!user_id(name, username, display_id)')
    .eq('role', role))
  return rows.map((r) => {
    const o = option(r.user_id, r.profiles)
    return r.agencies?.name ? { ...o, label: `${o.label} · ${r.agencies.name}` } : o
  })
}

/* Ordinary users who could take a seat (no panel role yet). */
export async function listHandoverTargets() {
  const [profiles, staff] = await Promise.all([
    supabase.from('profiles').select('id, name, username, display_id').eq('is_ghost', false)
      .order('name').limit(2000).then(unwrap),
    supabase.from('staff_roles').select('user_id').then(unwrap),
  ])
  const taken = new Set((staff || []).map((s) => s.user_id))
  return (profiles || []).filter((p) => !taken.has(p.id)).map((p) => option(p.id, p))
}

/* -> { role, agencies, sub_admins, coins } */
export async function handoverSeat(fromId, toId) {
  return unwrap(await supabase.rpc('master_handover_staff_seat', { p_from: fromId, p_to: toId }))
}

export const roleName = (r) => ROLE_LABEL[r] || HANDOVER_ROLES[r] || r
