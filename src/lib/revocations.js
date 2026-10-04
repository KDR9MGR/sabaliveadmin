import { supabase } from './supabase.js'
import { ROLE_LABEL } from './admin.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
const fmtWhen = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/* Every staff access revocation, newest first, from the audit log that
   revoke_staff_role / revoke_agency_manager write to:
     staff.revoked           target "<user id> (<role>)"        — one account
     agency.manager_revoked  target "<agency name> (<agency id>)" — an agency's
                             manager login(s); the log keeps the agency, not
                             the individual manager, so the row is the agency.
   `restored` marks an account that has a staff role again since. */
export async function listRevocations() {
  const logs = unwrap(await supabase.from('audit_logs')
    .select('id, actor_id, action, target, created_at')
    .in('action', ['staff.revoked', 'agency.manager_revoked'])
    .order('created_at', { ascending: false }).limit(1000))

  const parsed = (logs || []).map((l) => {
    const id = l.target?.match(UUID)?.[0] || null
    return { ...l, subjectId: id }
  })
  const userIds = [...new Set(parsed.filter((l) => l.action === 'staff.revoked' && l.subjectId).map((l) => l.subjectId))]
  const lookupIds = [...new Set([...userIds, ...parsed.map((l) => l.actor_id).filter(Boolean)])]

  const [profiles, stillStaff, agencies] = await Promise.all([
    lookupIds.length
      ? supabase.from('profiles').select('id, name, username, avatar_url, display_id').in('id', lookupIds).then(unwrap)
      : [],
    userIds.length
      ? supabase.from('staff_roles').select('user_id').in('user_id', userIds).then(unwrap)
      : [],
    parsed.some((l) => l.action === 'agency.manager_revoked')
      ? supabase.from('agencies').select('id, manager_id').then(unwrap)
      : [],
  ])
  const byId = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  const restored = new Set((stillStaff || []).map((s) => s.user_id))
  const hasManager = new Set((agencies || []).filter((a) => a.manager_id).map((a) => a.id))

  return parsed.map((l) => {
    const isAgency = l.action === 'agency.manager_revoked'
    const actor = byId[l.actor_id]
    const subject = !isAgency ? byId[l.subjectId] : null
    const role = !isAgency ? l.target?.match(/\(([a-z_]+)\)\s*$/)?.[1] : 'agency_manager'
    return {
      id: l.id,
      kind: isAgency ? 'Agency manager' : 'Staff account',
      userId: isAgency ? null : l.subjectId,
      agencyId: isAgency ? l.subjectId : null,
      user: isAgency ? l.target?.replace(/\s*\([^)]*\)\s*$/, '') || 'Agency' : (subject?.name || 'Unknown user'),
      username: subject?.username || '',
      avatar: subject?.avatar_url || null,
      displayId: subject?.display_id ?? null,
      role: ROLE_LABEL[role] || role || '—',
      by: actor?.name || (l.actor_id ? 'Unknown' : 'System'),
      byUsername: actor?.username || '',
      at: fmtWhen(l.created_at),
      state: isAgency
        ? (hasManager.has(l.subjectId) ? 'Restored' : 'Revoked')
        : (restored.has(l.subjectId) ? 'Restored' : 'Revoked'),
    }
  })
}
