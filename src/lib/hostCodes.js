import { supabase } from './supabase.js'
import { shortId, fmtDate } from './admin.js'
import { relativeTime } from './format.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

/* "in 12 days" for a future instant; "3 days ago" once it's past. */
function expiryLabel(iso) {
  if (!iso) return 'Never'
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return relativeTime(iso)
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `in ${mins} min${mins === 1 ? '' : 's'}`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `in ${hours} hour${hours === 1 ? '' : 's'}`
  const days = Math.round(hours / 24)
  if (days < 30) return `in ${days} day${days === 1 ? '' : 's'}`
  const months = Math.round(days / 30)
  return `in ${months} month${months === 1 ? '' : 's'}`
}

/* ---------------------------------------------------------------- host codes */
export async function listHostCodes(agencyId) {
  let q = supabase.from('host_codes')
    .select('id, code, label, agency_id, max_uses, used_count, expires_at, status, created_at, agencies(name), creator:created_by(name)')
    .order('created_at', { ascending: false })
    .limit(500)
  if (agencyId) q = q.eq('agency_id', agencyId)
  const rows = unwrap(await q)
  const now = Date.now()
  return rows.map((r) => {
    const expMs = r.expires_at ? new Date(r.expires_at).getTime() : null
    const expired = expMs != null && expMs <= now
    return {
      id: r.id,
      idShort: shortId(r.id),
      code: r.code,
      label: r.label || '—',
      agencyId: r.agency_id,
      agency: r.agencies?.name || 'Global (all agencies)',
      createdBy: r.creator?.name || '—',
      used: r.used_count,
      maxUses: r.max_uses,
      usage: `${r.used_count} / ${r.max_uses}`,
      exhausted: r.used_count >= r.max_uses,
      expiresAt: r.expires_at,
      expiresRel: expiryLabel(r.expires_at),
      expiresAbs: r.expires_at ? fmtDate(r.expires_at) : '—',
      expired,
      status: r.status === 'banned' ? 'Banned' : expired ? 'Expired' : 'Active',
      statusRaw: r.status,
      created: fmtDate(r.created_at),
    }
  })
}

/* ---------------------------------------------------------------- host grants */
export async function listHostGrants(agencyId, { activeOnly = false } = {}) {
  let q = supabase.from('host_grants')
    .select('id, profile_id, granted_at, expires_at, status, ban_reason, holder:profile_id(name, username), host_codes(code, label), agencies(name)')
    .order('granted_at', { ascending: false })
    .limit(1000)
  if (agencyId) q = q.eq('agency_id', agencyId)
  if (activeOnly) q = q.eq('status', 'active')
  const rows = unwrap(await q)
  const now = Date.now()
  return rows.map((r) => {
    const expMs = r.expires_at ? new Date(r.expires_at).getTime() : null
    const expired = expMs != null && expMs <= now
    return {
      id: r.id,
      idShort: shortId(r.id),
      profileId: r.profile_id,
      name: r.holder?.name || shortId(r.profile_id),
      username: r.holder?.username,
      code: r.host_codes?.code || '—',
      codeLabel: r.host_codes?.label || '',
      agency: r.agencies?.name || '—',
      grantedAt: fmtDate(r.granted_at),
      expiresAt: r.expires_at,
      expiresAbs: r.expires_at ? fmtDate(r.expires_at) : 'Never',
      expiresRel: expiryLabel(r.expires_at),
      expired,
      banReason: r.ban_reason || '',
      status: r.status === 'active' && expired ? 'Expired' : cap(r.status),
      statusRaw: r.status,
    }
  })
}

/* ---------------------------------------------------------------- writes (RPCs) */
export async function generateCode({ expiresAt, label, maxUses }) {
  return unwrap(await supabase.rpc('generate_host_code', {
    p_expires_at: expiresAt,
    p_label: label ? label.trim() : null,
    p_max_uses: Math.min(500, Math.max(1, Number(maxUses) || 1)),
  }))
}

export async function setCodeStatus(id, status) {
  const { error } = await supabase.rpc('set_host_code_status', { p_code_id: id, p_status: status })
  if (error) throw error
}

export async function setGrantStatus(id, status, reason) {
  const { error } = await supabase.rpc('set_host_grant_status', {
    p_grant_id: id, p_status: status, p_reason: reason ? reason.trim() : null,
  })
  if (error) throw error
}
