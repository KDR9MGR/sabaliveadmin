import { supabase } from './supabase.js'
import { shortId, fmtDate } from './admin.js'
import { listAgencyHosts } from './agency.js'

/* Data layer for the Country Admin and Global Admin panels. A country admin
   owns sub admins (staff_roles.country_admin_id), who own agencies
   (agencies.sub_admin_id), which hold hosts. "Scope" below is exactly that
   tree; a Global Admin (or an admin / super admin browsing the panel) sees the
   whole of it. Reads are filtered explicitly (host profiles are publicly
   readable); every write goes through an RPC that re-checks the same scope on
   the server (migrations 20260930140000 and 20260930160000). */

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const titleCase = (s) => (s ? String(s).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s)
const myId = async () => (await supabase.auth.getSession()).data.session?.user?.id
const rpc = async (fn, args) => { const { data, error } = await supabase.rpc(fn, args); if (error) throw error; return data }

/* ---------------------------------------------------------------- scope */
export async function countryScope() {
  const me = await myId()
  const mine = unwrap(await supabase.from('staff_roles').select('role').eq('user_id', me).maybeSingle())
  const seesAll = mine?.role !== 'country_admin'

  // Global view also needs the country admins, to label who owns each sub admin.
  const countryRows = seesAll
    ? unwrap(await supabase.from('staff_roles')
        .select('user_id, created_at, profiles(name, username, status, display_id)')
        .eq('role', 'country_admin')
        .order('created_at', { ascending: false }))
    : []
  const countryName = Object.fromEntries(countryRows.map((c) => [c.user_id, c.profiles?.name || shortId(c.user_id)]))

  let q = supabase.from('staff_roles')
    .select('user_id, created_at, country_admin_id, profiles(name, username, status, display_id)')
    .eq('role', 'sub_admin')
    .order('created_at', { ascending: false })
  if (!seesAll) q = q.eq('country_admin_id', me)
  const subRows = unwrap(await q)
  const subIds = subRows.map((s) => s.user_id)

  let aq = supabase.from('agencies')
    .select('id, display_id, name, country, status, commission_percent, sub_admin_id, created_at, manager:manager_id(name, username), host_profiles(count)')
    .order('created_at', { ascending: false })
  if (!seesAll) aq = subIds.length ? aq.in('sub_admin_id', subIds) : null
  const agencyRows = aq ? unwrap(await aq) : []

  const subName = Object.fromEntries(subRows.map((s) => [s.user_id, s.profiles?.name || shortId(s.user_id)]))
  const agencies = agencyRows.map((a) => ({
    id: a.id,
    idShort: shortId(a.id),
    displayId: a.display_id,
    name: a.name,
    subAdminId: a.sub_admin_id,
    subAdmin: subName[a.sub_admin_id] || 'Unassigned',
    manager: a.manager?.name || 'Unassigned',
    managerUsername: a.manager?.username,
    country: a.country,
    commission: Number(a.commission_percent),
    hosts: a.host_profiles?.[0]?.count ?? 0,
    status: titleCase(a.status),
    created: fmtDate(a.created_at),
  }))
  const subAdmins = subRows.map((s) => ({
    id: s.user_id,
    idShort: shortId(s.user_id),
    displayId: s.profiles?.display_id,
    name: s.profiles?.name || '—',
    username: s.profiles?.username,
    accountStatus: s.profiles?.status,
    countryAdminId: s.country_admin_id,
    countryAdmin: countryName[s.country_admin_id] || (seesAll ? 'Unassigned' : '—'),
    agencies: agencies.filter((a) => a.subAdminId === s.user_id).length,
    hosts: agencies.filter((a) => a.subAdminId === s.user_id).reduce((n, a) => n + a.hosts, 0),
    granted: fmtDate(s.created_at),
  }))
  const countryAdmins = countryRows.map((c) => {
    const subs = subAdmins.filter((s) => s.countryAdminId === c.user_id)
    return {
      id: c.user_id,
      idShort: shortId(c.user_id),
      displayId: c.profiles?.display_id,
      name: c.profiles?.name || '—',
      username: c.profiles?.username,
      accountStatus: c.profiles?.status,
      subAdmins: subs.length,
      agencies: subs.reduce((n, s) => n + s.agencies, 0),
      hosts: subs.reduce((n, s) => n + s.hosts, 0),
      granted: fmtDate(c.created_at),
    }
  })
  return { seesAll, countryAdmins, subAdmins, agencies }
}

/* Hosts in every agency of the scope, each tagged with its agency's sub admin. */
export async function listScopeHosts() {
  const { agencies } = await countryScope()
  if (!agencies.length) return []
  const subByAgency = Object.fromEntries(agencies.map((a) => [a.id, a.subAdmin]))
  const rows = await listAgencyHosts(agencies.map((a) => a.id))
  return rows.map((h) => ({ ...h, subAdmin: subByAgency[h.agencyId] || '—' }))
}

/* ---------------------------------------------------------------- pickers for Transfer Coins */
export async function scopeSubAdminOptions() {
  const { subAdmins } = await countryScope()
  return subAdmins.map((s) => ({
    value: s.id,
    label: `${s.name} (@${s.username || '—'}) · ID ${s.displayId}`,
    search: `${s.name} ${s.username} ${s.displayId}`.toLowerCase(),
  }))
}

/* Every country admin — recipients for a Global Admin's Transfer Coins. */
export async function scopeCountryAdminOptions() {
  const { countryAdmins } = await countryScope()
  return countryAdmins.map((c) => ({
    value: c.id,
    label: `${c.name} (@${c.username || '—'}) · ID ${c.displayId}`,
    search: `${c.name} ${c.username} ${c.displayId}`.toLowerCase(),
  }))
}

export async function scopeAgencyManagerOptions() {
  const { agencies } = await countryScope()
  if (!agencies.length) return []
  const names = Object.fromEntries(agencies.map((a) => [a.id, a.name]))
  const rows = unwrap(await supabase.from('staff_roles')
    .select('user_id, agency_id, profiles(name, username, display_id)')
    .eq('role', 'agency_manager')
    .in('agency_id', agencies.map((a) => a.id)))
  return rows.map((r) => ({
    value: r.user_id,
    label: `${names[r.agency_id]} — ${r.profiles?.name || 'Manager'} (@${r.profiles?.username || '—'})`,
    search: `${names[r.agency_id]} ${r.profiles?.name} ${r.profiles?.username} ${r.profiles?.display_id}`.toLowerCase(),
  }))
}

/* Other country admins — the targets for "Transfer Sub Admin". */
export async function otherCountryAdminOptions() {
  const me = await myId()
  const rows = unwrap(await supabase.from('staff_roles')
    .select('user_id, profiles(name, username)').eq('role', 'country_admin'))
  return rows
    .filter((r) => r.user_id !== me)
    .map((r) => ({ value: r.user_id, label: `${r.profiles?.name || shortId(r.user_id)} (@${r.profiles?.username || '—'})` }))
}

/* ---------------------------------------------------------------- actions (server re-checks scope) */
export const createCountryAgency = ({ name, country, subAdmin }) =>
  rpc('create_country_agency', { p_name: name, p_sub_admin: subAdmin, p_country: country || 'India' })

export const transferAgency = ({ agencyId, toSubAdmin }) =>
  rpc('country_transfer_agency', { p_agency_id: agencyId, p_to_sub_admin: toSubAdmin })

export const transferHost = ({ hostId, toAgency, reason }) =>
  rpc('country_transfer_host', { p_host_id: hostId, p_to_agency: toAgency, p_reason: reason || null })

export const transferSubAdmin = ({ subAdminId, toCountryAdmin }) =>
  rpc('transfer_sub_admin', { p_sub_admin: subAdminId, p_to_country_admin: toCountryAdmin })
