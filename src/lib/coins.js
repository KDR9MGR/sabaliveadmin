import { supabase } from './supabase.js'
import { shortId, fmtDate, ROLE_LABEL } from './admin.js'
import { relativeTime } from './format.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const titleCase = (s) => (s ? String(s).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s)
const lc = (patch, keys) => { const o = { ...patch }; for (const k of keys) if (typeof o[k] === 'string') o[k] = o[k].toLowerCase(); return o }
const myId = async () => (await supabase.auth.getSession()).data.session?.user?.id
const num = (v) => (v === '' || v == null ? undefined : Number(v))

export const GIFT_CATEGORIES = ['basic', 'luxury', 'vehicle', 'special']
export const PLATFORMS = ['all', 'android', 'ios']

/* ---------------------------------------------------------------- pickers */
export async function profileOptions() {
  const rows = unwrap(await supabase.from('profiles').select('id, name, username, display_id').order('name').limit(1000))
  return rows.map((p) => ({
    value: p.id,
    label: `${p.name} (@${p.username}) · ID ${p.display_id}`,
    search: `${p.name} ${p.username} ${p.display_id}`.toLowerCase(),
  }))
}

/* ---------------------------------------------------------------- gifts */
export async function listGifts() {
  const rows = unwrap(await supabase.from('gifts')
    .select('id, name, emoji, icon_url, price_coins, category, has_effect, status, sort_order')
    .order('sort_order').order('price_coins'))
  return rows.map((g) => ({
    id: g.id, idShort: shortId(g.id),
    name: g.name, emoji: g.emoji, iconUrl: g.icon_url,
    price: g.price_coins,
    category: titleCase(g.category),
    hasEffect: g.has_effect,
    status: titleCase(g.status),
  }))
}
export async function createGift(v) {
  return unwrap(await supabase.from('gifts').insert({
    name: v.name, emoji: v.emoji || '🎁', icon_url: v.icon_url || null,
    price_coins: num(v.price_coins),
    category: (v.category || 'basic').toLowerCase(),
    has_effect: !!v.has_effect,
    status: (v.status || 'active').toLowerCase(),
  }).select().single())
}
export async function updateGift(id, v) {
  const p = lc({ name: v.name, emoji: v.emoji, category: v.category, status: v.status }, ['category', 'status'])
  if (v.icon_url !== undefined) p.icon_url = v.icon_url || null
  if (v.price_coins != null) p.price_coins = num(v.price_coins)
  if (v.has_effect != null) p.has_effect = !!v.has_effect
  return unwrap(await supabase.from('gifts').update(p).eq('id', id).select().single())
}
export async function deleteGift(id) { const { error } = await supabase.from('gifts').delete().eq('id', id); if (error) throw error }

/* ---------------------------------------------------------------- coin packages */
export async function listCoinPackages() {
  const rows = unwrap(await supabase.from('coin_packages')
    .select('id, name, coins, bonus_coins, price_inr, platform, status, sort_order')
    .order('sort_order').order('price_inr'))
  return rows.map((p) => ({
    id: p.id, idShort: shortId(p.id),
    name: p.name, coins: p.coins, bonus: p.bonus_coins,
    price: p.price_inr,
    platform: titleCase(p.platform),
    status: titleCase(p.status),
  }))
}
export async function createCoinPackage(v) {
  return unwrap(await supabase.from('coin_packages').insert({
    name: v.name,
    coins: num(v.coins),
    bonus_coins: num(v.bonus_coins) || 0,
    price_inr: num(v.price_inr),
    platform: (v.platform || 'all').toLowerCase(),
    status: (v.status || 'active').toLowerCase(),
  }).select().single())
}
export async function updateCoinPackage(id, v) {
  const p = lc({ name: v.name, platform: v.platform, status: v.status }, ['platform', 'status'])
  for (const [k, col] of [['coins', 'coins'], ['bonus_coins', 'bonus_coins'], ['price_inr', 'price_inr']]) {
    if (v[k] != null && v[k] !== '') p[col] = Number(v[k])
  }
  return unwrap(await supabase.from('coin_packages').update(p).eq('id', id).select().single())
}
export async function deleteCoinPackage(id) { const { error } = await supabase.from('coin_packages').delete().eq('id', id); if (error) throw error }

/* ---------------------------------------------------------------- wallet ledger (Transactions) */
export async function listWalletLedger() {
  const rows = unwrap(await supabase.from('wallet_ledger')
    .select('id, kind, currency, amount, note, created_at, profiles(name, username)')
    .order('created_at', { ascending: false }).limit(500))
  return rows.map((r) => ({
    id: r.id, idShort: shortId(r.id),
    user: r.profiles?.name || '—',
    username: r.profiles?.username,
    kind: titleCase(r.kind),
    currency: titleCase(r.currency),
    amount: r.amount,
    note: r.note || '—',
    date: fmtDate(r.created_at),
    when: relativeTime(r.created_at),
  }))
}

/* ---------------------------------------------------------------- gift transactions (Gift History) */
export async function listGiftTransactions() {
  const rows = unwrap(await supabase.from('gift_transactions')
    .select('id, coins, created_at, sender:sender_id(name), receiver:receiver_id(name), gifts(name, emoji)')
    .order('created_at', { ascending: false }).limit(500))
  return rows.map((r) => ({
    id: r.id, idShort: shortId(r.id),
    sender: r.sender?.name || '—',
    receiver: r.receiver?.name || '—',
    gift: r.gifts ? `${r.gifts.emoji} ${r.gifts.name}` : '—',
    coins: r.coins,
    date: fmtDate(r.created_at),
    when: relativeTime(r.created_at),
  }))
}

/* ---------------------------------------------------------------- coin grants (Transfer Coins / History) */
export async function createCoinGrant({ granted_to, coins, note }) {
  const granted_by = await myId()
  return unwrap(await supabase.from('coin_grants').insert({
    granted_to, granted_by, coins: Number(coins), note: note || null,
  }).select().single())
}
/* The signed-in Master's OWN coin history — grants and wallet transfers where
   this account is the sender/granter or the receiver, not the platform-wide
   list (RLS lets any admin read every row, so the filter lives here). */
export async function listMyCoinHistory() {
  const me = await myId()
  const typeOf = (p) => (p?.staff_roles?.role ? (ROLE_LABEL[p.staff_roles.role] || p.staff_roles.role) : 'User')
  const [grants, transfers] = await Promise.all([
    supabase.from('coin_grants')
      .select('id, coins, note, created_at, granted_by, recipient:granted_to(name, username, staff_roles!user_id(role)), granter:granted_by(name)')
      .or(`granted_by.eq.${me},granted_to.eq.${me}`)
      .order('created_at', { ascending: false }).limit(500).then(unwrap),
    supabase.from('coin_transfers')
      .select('id, coins, note, created_at, sender_id, sender:sender_id(name), recipient:recipient_id(name, username, staff_roles!user_id(role))')
      .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
      .order('created_at', { ascending: false }).limit(500).then(unwrap),
  ])
  const rows = [
    ...grants.map((r) => ({
      id: `grant-${r.id}`, grantId: r.id, idShort: shortId(r.id),
      recipient: r.recipient?.name || '—', username: r.recipient?.username, recipientType: typeOf(r.recipient),
      coins: r.coins, by: r.granter?.name || '—', note: r.note || '—',
      direction: r.granted_by === me ? 'Sent' : 'Received', canPullBack: r.granted_by === me,
      at: r.created_at, date: fmtDate(r.created_at),
    })),
    ...transfers.map((r) => ({
      id: `transfer-${r.id}`, idShort: shortId(r.id),
      recipient: r.recipient?.name || '—', username: r.recipient?.username, recipientType: typeOf(r.recipient),
      coins: Number(r.coins), by: r.sender?.name || '—', note: r.note || '—',
      direction: r.sender_id === me ? 'Sent' : 'Received', canPullBack: false,
      at: r.created_at, date: fmtDate(r.created_at),
    })),
  ]
  return rows.sort((a, b) => new Date(b.at) - new Date(a.at))
}

/* Reverses a coin_grants-sourced credit (a direct grant or one row of a
   distribute_coins batch) — deducts from the recipient's current balance,
   fails if they've already spent below what was granted. */
export async function pullBackCoinGrant(id) {
  const { error } = await supabase.rpc('pull_back_coin_grant', { p_grant_id: id })
  if (error) throw error
}
