import { supabase } from './supabase.js'
import { fmtDate } from './admin.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const rpc = async (fn, args) => { const { data, error } = await supabase.rpc(fn, args); if (error) throw error; return data }

/* Lucky IDs: special app ID numbers (e.g. 888888). While owned, one replaces the
   user's app ID everywhere; when it expires or is revoked their own ID comes back.
   Table lucky_ids (sabalive migration 20261004140000). */
/* A number as written: 786 with 4 digits is 0786. */
const written = (number, digits) => String(number).padStart(digits || 0, '0')

export async function listLuckyIds() {
  const cols = 'id, number, price_coins, duration_days, status, owner_id, expires_at, owner:owner_id(name, username)'
  let res = await supabase.from('lucky_ids').select(`${cols}, digits`).order('number').limit(2000)
  // `digits` arrives with migration 20261005090000 (leading-zero IDs) — tolerate it not being applied yet
  if (res.error && /digits/.test(res.error.message || '')) {
    res = await supabase.from('lucky_ids').select(cols).order('number').limit(2000)
  }
  const rows = unwrap(res)
  const now = Date.now()
  return rows.map((r) => {
    const taken = !!r.owner_id && new Date(r.expires_at).getTime() > now
    return {
      id: r.id,
      number: written(r.number, r.digits),
      price: r.price_coins,
      days: r.duration_days,
      rawStatus: r.status,
      state: r.status !== 'active' ? 'Inactive' : taken ? 'Taken' : 'Available',
      taken,
      ownerId: taken ? r.owner_id : null,
      owner: taken ? `${r.owner?.name || '—'} (@${r.owner?.username || '—'})` : '',
      expires: taken ? fmtDate(r.expires_at) : '',
    }
  })
}

export const saveLuckyId = ({ id, number, price, days, status }) =>
  rpc('admin_save_lucky_id', {
    p_id: id || null, p_number: String(number).trim(), p_price: Number(price) || 0, p_days: Number(days) || 30, p_status: status,
  })
export const deleteLuckyId = (id) => rpc('admin_delete_lucky_id', { p_id: id })
export const assignLuckyId = (luckyId, userId, days) =>
  rpc('admin_assign_lucky_id', { p_lucky: luckyId, p_user: userId, p_days: days ? Number(days) : null })
export const revokeLuckyId = (luckyId) => rpc('admin_revoke_lucky_id', { p_lucky: luckyId })

/* The Lucky ID a user currently wears, for their detail page. */
export async function userLuckyId(userId) {
  const q = (cols) => supabase.from('lucky_ids').select(cols)
    .eq('owner_id', userId).gt('expires_at', new Date().toISOString()).maybeSingle()
  let res = await q('id, number, digits, expires_at')
  if (res.error && /digits/.test(res.error.message || '')) res = await q('id, number, expires_at')
  const row = unwrap(res)
  return row ? { id: row.id, number: written(row.number, row.digits), expires: fmtDate(row.expires_at) } : null
}

export async function availableLuckyOptions() {
  const rows = await listLuckyIds()
  return rows.filter((r) => r.state === 'Available').map((r) => ({ value: r.id, label: `${r.number} · ${r.days} days` }))
}
