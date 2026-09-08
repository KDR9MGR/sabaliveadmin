import { supabase } from './supabase.js'
import { shortId, fmtDate } from './admin.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const titleCase = (s) => (s ? String(s).split(/[_:]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s)

export const DISTRIBUTION_ROLES = ['host', 'agency', 'sub_admin', 'staff']

/* -------------------------------------------------------------- treasury */
export async function getTreasury() {
  const [row, wallets] = await Promise.all([
    supabase.from('coin_treasury').select('minted_total, distributed_total, balance, updated_at').eq('id', true).single(),
    supabase.from('wallets').select('coins'),
  ])
  if (row.error) throw row.error
  if (wallets.error) throw wallets.error
  const circulation = (wallets.data || []).reduce((s, w) => s + Number(w.coins || 0), 0)
  return {
    minted: Number(row.data.minted_total),
    distributed: Number(row.data.distributed_total),
    balance: Number(row.data.balance),
    circulation,
    updatedAt: row.data.updated_at,
  }
}

export async function listTreasuryEvents() {
  const rows = unwrap(await supabase.from('coin_treasury_events')
    .select('id, event_type, coins, per_recipient, audience, recipients, note, created_at, actor:created_by(name)')
    .order('created_at', { ascending: false })
    .limit(200))
  return rows.map((e) => ({
    id: e.id, idShort: shortId(e.id),
    type: titleCase(e.event_type),
    coins: Number(e.coins),
    perRecipient: e.per_recipient ? Number(e.per_recipient) : null,
    audience: e.audience ? titleCase(e.audience) : '—',
    recipients: e.recipients || 0,
    note: e.note || '—',
    by: e.actor?.name || '—',
    at: fmtDate(e.created_at),
  }))
}

export async function mintCoins({ coins, note }) {
  return unwrap(await supabase.rpc('mint_coins', { p_coins: Number(coins), p_note: note || null }))
}

export async function distributeCoins({ perRecipient, audience, role, recipientIds, note }) {
  const { data, error } = await supabase.rpc('distribute_coins', {
    p_per_recipient: Number(perRecipient),
    p_audience: audience,
    p_role: audience === 'role' ? role : null,
    p_recipient_ids: audience === 'users' ? (recipientIds || []) : null,
    p_note: note || null,
  })
  if (error) throw error
  return data // { recipients, total, balance }
}

/* -------------------------------------------------------------- minter allow-list */
export async function listCoinMinters() {
  const rows = unwrap(await supabase.from('coin_minters')
    .select('profile_id, added_at, profile:profile_id(name, username), adder:added_by(name)')
    .order('added_at', { ascending: false }))
  return rows.map((m) => ({
    id: m.profile_id, idShort: shortId(m.profile_id),
    name: m.profile?.name || shortId(m.profile_id),
    username: m.profile?.username,
    addedBy: m.adder?.name || '—',
    addedAt: fmtDate(m.added_at),
  }))
}

export async function addCoinMinter(profileId) {
  const me = (await supabase.auth.getSession()).data.session?.user?.id
  return unwrap(await supabase.from('coin_minters').insert({ profile_id: profileId, added_by: me }).select().single())
}

export async function removeCoinMinter(profileId) {
  const { error } = await supabase.from('coin_minters').delete().eq('profile_id', profileId)
  if (error) throw error
}

// staff accounts not already on the allow-list (super_admins always may mint,
// so they're excluded from the picker)
export async function minterCandidates() {
  const [staff, minters] = await Promise.all([
    supabase.from('staff_roles').select('user_id, role, profiles(name, username)'),
    supabase.from('coin_minters').select('profile_id'),
  ])
  if (staff.error) throw staff.error
  if (minters.error) throw minters.error
  const taken = new Set((minters.data || []).map((m) => m.profile_id))
  return (staff.data || [])
    .filter((s) => s.role !== 'super_admin' && !taken.has(s.user_id))
    .map((s) => ({ value: s.user_id, label: `${s.profiles?.name || shortId(s.user_id)} (@${s.profiles?.username || '—'})` }))
}

/* recipient picker for "specific users" distribution */
export async function profilePickList() {
  const rows = unwrap(await supabase.from('profiles').select('id, name, username').order('name').limit(1000))
  return rows.map((p) => ({ value: p.id, label: `${p.name} (@${p.username})` }))
}
