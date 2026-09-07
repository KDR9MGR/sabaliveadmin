import { supabase } from './supabase.js'
import { shortId } from './admin.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const titleCase = (s) => (s ? String(s).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s)
const num = (v) => (v === '' || v == null ? 0 : Number(v))

export const PLAN_STATUSES = ['active', 'archived']

export async function listCommissionPlans() {
  const rows = unwrap(await supabase.from('commission_plans')
    .select('id, name, agency_commission_percent, host_payout_percent, min_monthly_diamonds, status, notes, updated_at')
    .order('agency_commission_percent'))
  return rows.map((p) => ({
    id: p.id, idShort: shortId(p.id),
    name: p.name,
    agencyPct: Number(p.agency_commission_percent),
    hostPct: Number(p.host_payout_percent),
    minDiamonds: p.min_monthly_diamonds || 0,
    notes: p.notes || '—',
    status: titleCase(p.status),
    updated: p.updated_at,
  }))
}

export async function createCommissionPlan(v) {
  return unwrap(await supabase.from('commission_plans').insert({
    name: v.name,
    agency_commission_percent: num(v.agency_commission_percent),
    host_payout_percent: num(v.host_payout_percent),
    min_monthly_diamonds: Math.round(num(v.min_monthly_diamonds)),
    status: (v.status || 'active').toLowerCase(),
    notes: v.notes || null,
  }).select().single())
}

export async function updateCommissionPlan(id, v) {
  const p = {}
  if (v.name != null) p.name = v.name
  if (v.agency_commission_percent !== undefined) p.agency_commission_percent = num(v.agency_commission_percent)
  if (v.host_payout_percent !== undefined) p.host_payout_percent = num(v.host_payout_percent)
  if (v.min_monthly_diamonds !== undefined) p.min_monthly_diamonds = Math.round(num(v.min_monthly_diamonds))
  if (v.status) p.status = v.status.toLowerCase()
  if (v.notes !== undefined) p.notes = v.notes || null
  return unwrap(await supabase.from('commission_plans').update(p).eq('id', id).select().single())
}

export const setCommissionPlanStatus = (id, status) => updateCommissionPlan(id, { status })
