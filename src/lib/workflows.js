import { supabase } from './supabase.js'
import { shortId, fmtDate } from './admin.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const titleCase = (s) => (s ? String(s).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s)
const myId = async () => (await supabase.auth.getSession()).data.session?.user?.id

/* ------------------------------------------------------------ pickers */
export async function agencyOptions() {
  const rows = unwrap(await supabase.from('agencies').select('id, name').order('name'))
  return rows.map((a) => ({ value: a.id, label: a.name }))
}
export async function hostOptions() {
  const rows = unwrap(await supabase.from('host_profiles').select('profile_id, agency_id, profiles(name)'))
  return rows.map((h) => ({ value: h.profile_id, label: h.profiles?.name || shortId(h.profile_id), agency_id: h.agency_id }))
}
export async function subAdminOptions() {
  const rows = unwrap(await supabase.from('staff_roles').select('user_id, agency_id, profiles(name)').eq('role', 'sub_admin'))
  return rows.map((s) => ({ value: s.user_id, label: s.profiles?.name || shortId(s.user_id), agency_id: s.agency_id }))
}

/* ------------------------------------------------------------ transfer requests */
export async function listTransferRequests() {
  const rows = unwrap(await supabase
    .from('transfer_requests')
    .select('id, subject_type, subject_id, status, reason, created_at, decided_at, subject:subject_id(name), from_agency:from_agency_id(name), to_agency:to_agency_id(name), requester:requested_by(name)')
    .order('created_at', { ascending: false })
    .limit(500))
  return rows.map((r) => ({
    id: r.id,
    idShort: shortId(r.id),
    type: titleCase(r.subject_type),
    subject: r.subject?.name || shortId(r.subject_id),
    from: r.from_agency?.name || '—',
    to: r.to_agency?.name || '—',
    requestedBy: r.requester?.name || '—',
    reason: r.reason || '—',
    status: titleCase(r.status),
    date: fmtDate(r.created_at),
  }))
}

export async function createTransferRequest({ subject_type, subject_id, from_agency_id, to_agency_id, reason }) {
  const requested_by = await myId()
  return unwrap(await supabase.from('transfer_requests').insert({
    subject_type, subject_id,
    from_agency_id: from_agency_id || null,
    to_agency_id, requested_by, reason: reason || null,
  }).select().single())
}

export async function decideTransfer(id, approve) {
  return unwrap(await supabase.rpc('decide_transfer_request', { p_request_id: id, p_approve: approve }))
}

/* ------------------------------------------------------------ host applications */
export async function listHostApplications() {
  const rows = unwrap(await supabase
    .from('host_applications')
    .select('id, experience, followers_other_apps, status, created_at, reviewed_at, applicant:applicant_id(name, username), agencies(name)')
    .order('created_at', { ascending: false })
    .limit(500))
  return rows.map((r) => ({
    id: r.id,
    idShort: shortId(r.id),
    applicant: r.applicant?.name || '—',
    username: r.applicant?.username,
    agency: r.agencies?.name || 'Direct (no agency)',
    experience: r.experience || '—',
    extFollowers: r.followers_other_apps || 0,
    status: titleCase(r.status),
    submitted: fmtDate(r.created_at),
  }))
}

export async function decideHostApplication(id, status) {
  const reviewed_by = await myId()
  return unwrap(await supabase.from('host_applications')
    .update({ status, reviewed_by, reviewed_at: new Date().toISOString() })
    .eq('id', id).select().single())
}

/* ------------------------------------------------------------ assignments */
export async function listAssignments() {
  const rows = unwrap(await supabase
    .from('assignments')
    .select('id, shift, target_hours, done_hours, status, created_at, host:host_id(name), sub_admin:sub_admin_id(name)')
    .order('created_at', { ascending: false })
    .limit(500))
  return rows.map((r) => ({
    id: r.id,
    idShort: shortId(r.id),
    host: r.host?.name || '—',
    subAdmin: r.sub_admin?.name || '—',
    shift: titleCase(r.shift),
    target: Number(r.target_hours) || 0,
    done: Number(r.done_hours) || 0,
    status: titleCase(r.status),
  }))
}

export async function createAssignment({ host_id, sub_admin_id, shift, target_hours }) {
  return unwrap(await supabase.from('assignments').insert({
    host_id, sub_admin_id,
    shift: (shift || 'flexible').toLowerCase(),
    target_hours: Number(target_hours) || 0,
  }).select().single())
}

export async function updateAssignment(id, patch) {
  const clean = { ...patch }
  if (clean.shift) clean.shift = clean.shift.toLowerCase()
  if (clean.status) clean.status = clean.status.toLowerCase()
  for (const k of ['target_hours', 'done_hours']) if (clean[k] != null && clean[k] !== '') clean[k] = Number(clean[k])
  return unwrap(await supabase.from('assignments').update(clean).eq('id', id).select().single())
}

/* ------------------------------------------------------------ withdrawals */
export async function listWithdrawals() {
  const rows = unwrap(await supabase
    .from('withdrawals')
    .select('id, diamonds, amount_inr, status, requested_at, processed_at, payee:profile_id(name, username)')
    .order('requested_at', { ascending: false })
    .limit(500))
  return rows.map((r) => ({
    id: r.id,
    idShort: shortId(r.id),
    payee: r.payee?.name || '—',
    username: r.payee?.username,
    diamonds: r.diamonds || 0,
    amountInr: r.amount_inr,
    status: titleCase(r.status),
    requested: fmtDate(r.requested_at),
    processed: r.processed_at ? fmtDate(r.processed_at) : '—',
  }))
}

export async function decideWithdrawal(id, approve) {
  return unwrap(await supabase.rpc('decide_withdrawal', { p_withdrawal_id: id, p_approve: approve }))
}
