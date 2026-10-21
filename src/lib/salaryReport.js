import { supabase } from './supabase.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }

/* "YYYY-MM" of the current IST month, shifted by `offset` months (-1 = last month). The database cuts months in India time. */
export function istMonth(offset = 0) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  now.setDate(1)
  now.setMonth(now.getMonth() + offset)
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/* ---------------------------------------------------------------- slabs
   "Earned at least X gift diamonds in a month (and, when set, Y live hours and Z live days) -> reward ₹R". A host gets the best slab
   they qualify for. Everyone on staff can read them; a Master / Super Admin edits them (RLS enforces it). sabalive migration 20261021120000. */
export async function listSalarySlabs() {
  const rows = unwrap(await supabase.from('salary_slabs')
    .select('id, name, min_diamonds, min_live_hours, min_live_days, reward_inr, active')
    .order('min_diamonds', { ascending: true }).order('reward_inr', { ascending: true }))
  return rows.map((r) => ({
    id: r.id, name: r.name, minDiamonds: Number(r.min_diamonds), minLiveHours: Number(r.min_live_hours),
    minLiveDays: Number(r.min_live_days), reward: Number(r.reward_inr), active: r.active,
  }))
}

export async function saveSalarySlab(v, id) {
  const row = {
    name: String(v.name || '').trim(),
    min_diamonds: Number(v.min_diamonds),
    min_live_hours: Number(v.min_live_hours || 0),
    min_live_days: Number(v.min_live_days || 0),
    reward_inr: Number(v.reward_inr),
    updated_at: new Date().toISOString(),
  }
  if (!row.name) throw new Error('Give the slab a name')
  if (!(row.min_diamonds > 0)) throw new Error('Diamonds earned must be more than 0')
  if (!(row.reward_inr >= 0)) throw new Error('Reward must be 0 or more')
  if (id) return unwrap(await supabase.from('salary_slabs').update(row).eq('id', id).select().single())
  return unwrap(await supabase.from('salary_slabs').insert(row).select().single())
}

export async function setSalarySlabActive(id, active) {
  return unwrap(await supabase.from('salary_slabs').update({ active, updated_at: new Date().toISOString() }).eq('id', id).select().single())
}

export async function deleteSalarySlab(id) {
  const { error } = await supabase.from('salary_slabs').delete().eq('id', id)
  if (error) throw error
}

/* ---------------------------------------------------------------- monthly report
   One row per host for an IST month: gift diamonds EARNED (Lucky Box, games and grants are not earnings), live hours and days (a day = 60+
   minutes live), diamonds withdrawn in the month, diamonds available now, the slab reached and its reward, the payslip if there is one, and
   why a host is blocked. Scoped by the database: each role only gets its own agencies. */
export async function getSalaryReport(month, agencyId) {
  const { data, error } = await supabase.rpc('salary_report', { p_month: month, p_agency: agencyId || null })
  if (error) throw error
  return (data || []).map((r) => ({
    id: r.host_id,
    hostId: r.host_id,
    host: r.host_name || '—',
    username: r.host_username,
    displayId: r.host_display_id,
    agencyId: r.agency_id,
    agency: r.agency_name || '—',
    period: r.period,
    earned: Number(r.diamonds_earned),
    hours: Number(r.live_hours),
    days: Number(r.live_days),
    withdrawn: Number(r.withdrawn_diamonds),
    available: Number(r.available_diamonds),
    slabId: r.slab_id,
    slab: r.slab_name,
    reward: r.reward_inr != null ? Number(r.reward_inr) : null,
    payslipId: r.payslip_id,
    payslipStatus: r.payslip_status,
    blocked: r.blocked_reason,
  }))
}

/* Creates one 'processing' payslip per host that reached a slab, for a month that has ended. No wallet money moves; staff mark the payslips
   paid from the Payslips list. A host never gets two for the same month. Returns { period, assigned, total_inr, already_had_payslip, blocked }. */
export async function assignSalaryRewards(month, agencyId) {
  const { data, error } = await supabase.rpc('salary_assign_rewards', { p_month: month, p_agency: agencyId || null })
  if (error) throw error
  return data
}

/* One row per IST month, newest first (the current month, then back; at most 24): hosts earning, diamonds earned, hosts that reached a slab and
   what their rewards add up to, the payslips that exist and how much of them is paid. Built from salary_report, so the numbers match the
   per-host table, with the same scope. sabalive migration 20261021140000. */
export async function getSalaryMonths(months = 12, agencyId) {
  const { data, error } = await supabase.rpc('salary_month_summary', { p_months: months, p_agency: agencyId || null })
  if (error) throw error
  return (data || []).map((r) => ({
    id: r.month,
    month: r.month,
    period: r.period,
    ended: !!r.month_ended,
    hostsEarning: Number(r.hosts_earning),
    earned: Number(r.diamonds_earned),
    hostsWithSlab: Number(r.hosts_with_slab),
    reward: Number(r.reward_total),
    payslips: Number(r.payslips),
    payslipsInr: Number(r.payslips_inr),
    paidInr: Number(r.paid_inr),
  }))
}
