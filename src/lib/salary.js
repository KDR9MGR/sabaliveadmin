import { supabase } from './supabase.js'
import { shortId, fmtDate } from './admin.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const titleCase = (s) => (s ? String(s).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s)
const n = (v) => (v === '' || v == null ? 0 : Number(v))

export const SALARY_ROLES = ['host', 'sub_admin', 'agency_manager']
export const SALARY_STATUSES = ['processing', 'paid', 'on_hold']

/* ---------------------------------------------------------------- pickers */
export async function payeeOptions() {
  const rows = unwrap(await supabase.from('profiles').select('id, name, username').order('name').limit(1000))
  return rows.map((p) => ({ value: p.id, label: `${p.name} (@${p.username})` }))
}
export async function agencyOptions() {
  const rows = unwrap(await supabase.from('agencies').select('id, name').order('name'))
  return rows.map((a) => ({ value: a.id, label: a.name }))
}

/* ---------------------------------------------------------------- list */
export async function listSalary() {
  const rows = unwrap(await supabase.from('salary_payments')
    .select('id, role, period, base_amount, bonus_amount, deductions, net_amount, status, paid_at, created_at, payee:payee_id(name, username), agencies(name)')
    .order('created_at', { ascending: false })
    .limit(1000))
  return rows.map((r) => ({
    id: r.id,
    idShort: shortId(r.id),
    payee: r.payee?.name || '—',
    username: r.payee?.username,
    role: titleCase(r.role),
    agency: r.agencies?.name || '—',
    period: r.period,
    base: Number(r.base_amount) || 0,
    bonus: Number(r.bonus_amount) || 0,
    deductions: Number(r.deductions) || 0,
    net: Number(r.net_amount) || 0,
    status: titleCase(r.status),
    paidAt: r.paid_at ? fmtDate(r.paid_at) : '—',
  }))
}

/* ---------------------------------------------------------------- mutations
   net_amount is a GENERATED column — never write it. */
export async function createSalaryPayment(v) {
  return unwrap(await supabase.from('salary_payments').insert({
    payee_id: v.payee_id,
    role: (v.role || 'host').toLowerCase(),
    agency_id: v.agency_id || null,
    period: v.period,
    base_amount: n(v.base_amount),
    bonus_amount: n(v.bonus_amount),
    deductions: n(v.deductions),
  }).select().single())
}

export async function setSalaryStatus(id, status) {
  const s = status.toLowerCase()
  return unwrap(await supabase.from('salary_payments')
    .update({ status: s, paid_at: s === 'paid' ? new Date().toISOString() : null })
    .eq('id', id).select().single())
}

export async function updateSalaryPayment(id, v) {
  const patch = { period: v.period }
  for (const [k, col] of [['base_amount', 'base_amount'], ['bonus_amount', 'bonus_amount'], ['deductions', 'deductions']]) {
    if (v[k] != null && v[k] !== '') patch[col] = Number(v[k])
  }
  if (v.role) patch.role = v.role.toLowerCase()
  return unwrap(await supabase.from('salary_payments').update(patch).eq('id', id).select().single())
}
