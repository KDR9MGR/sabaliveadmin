import { supabase } from './supabase.js'
import { shortId, fmtDate } from './admin.js'
import { myCoinGrants } from './treasury.js'
import { staffEmails } from './country.js'

/* Data layer for the staff hierarchy (Sub Admin now; Country Admin builds on
   the same calls). Coin balances are wallets.coins at every level; a transfer
   moves coins one level down via the transfer_coins_down RPC and is logged in
   coin_transfers (see migration 20260930120000). */

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const myId = async () => (await supabase.auth.getSession()).data.session?.user?.id
const titleCase = (s) => (s ? String(s).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s)

/* ---------------------------------------------------------------- balance */
export async function myCoinBalance() {
  const row = unwrap(await supabase.from('wallets').select('coins').eq('profile_id', await myId()).maybeSingle())
  return Number(row?.coins ?? 0)
}

/* ---------------------------------------------------------------- transfers */
export async function transferCoinsDown({ to, coins, note }) {
  const { data, error } = await supabase.rpc('transfer_coins_down', {
    p_recipient: to,
    p_coins: Number(coins),
    p_note: note || null,
  })
  if (error) throw error
  return data
}

const transferRow = (r) => ({
  id: r.id,
  idShort: shortId(r.id),
  from: r.sender?.name || '—',
  fromUsername: r.sender?.username,
  recipient: r.recipient?.name || '—',
  username: r.recipient?.username,
  recipientId: r.recipient?.display_id,
  agency: r.agency?.name || '—',
  coins: Number(r.coins),
  note: r.note || '—',
  date: fmtDate(r.created_at),
  at: r.created_at,
})

/* History of transfers to one recipient kind ('agency' | 'user' | 'sub_admin').
   RLS decides what's visible: what I sent, what I received, and what my
   downstream agencies sent (manages_agency). */
export async function listCoinTransfers(kind) {
  const rows = unwrap(await supabase.from('coin_transfers')
    .select('id, coins, note, created_at, recipient_kind, sender:sender_id(name, username), recipient:recipient_id(name, username, display_id), agency:agency_id(name)')
    .eq('recipient_kind', kind)
    .order('created_at', { ascending: false })
    .limit(500))
  return rows.map(transferRow)
}

/* User-directed history: coin_transfers plus the older treasury-based grants
   this account made before balances existed, so nothing disappears. */
export async function listUserCoinHistory() {
  const [transfers, legacy] = await Promise.all([listCoinTransfers('user'), myCoinGrants()])
  const legacyRows = legacy.map((g) => ({
    id: `grant-${g.id}`, idShort: g.idShort, from: 'You (treasury)', fromUsername: undefined,
    recipient: g.recipient, username: g.username, recipientId: undefined, agency: '—',
    coins: g.coins, note: g.note, date: g.date, at: null,
  }))
  return [...transfers, ...legacyRows]
}

/* ---------------------------------------------------------------- agencies I own (sub admin) */
export async function listOwnedAgencies() {
  const me = await myId()
  const rows = unwrap(await supabase.from('agencies')
    .select('id, display_id, name, country, status, commission_percent, created_at, manager_id, manager:manager_id(name, username, avatar_url), host_profiles(count)')
    .eq('sub_admin_id', me)
    .order('created_at', { ascending: false }))
  const emails = await staffEmails(rows.map((a) => a.manager_id))
  return rows.map((a) => ({
    id: a.id,
    idShort: shortId(a.id),
    displayId: a.display_id,
    name: a.name,
    manager: a.manager?.name || 'Unassigned',
    managerUsername: a.manager?.username,
    email: emails[a.manager_id] || '',
    avatar: a.manager?.avatar_url || null,
    role: 'Agency',
    country: a.country,
    commission: Number(a.commission_percent),
    hosts: a.host_profiles?.[0]?.count ?? 0,
    status: titleCase(a.status),
    created: fmtDate(a.created_at),
  }))
}

export async function createSubAdminAgency({ name, country }) {
  return unwrap(await supabase.rpc('create_sub_admin_agency', { p_name: name, p_country: country || 'India' }))
}

/* Managers of the agencies I own — the "Agency" recipients for Transfer Coins. */
export async function ownedAgencyManagerOptions() {
  const me = await myId()
  const agencies = unwrap(await supabase.from('agencies').select('id, name').eq('sub_admin_id', me))
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
