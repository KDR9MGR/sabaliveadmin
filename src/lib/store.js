import { supabase } from './supabase.js'
import { shortId } from './admin.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const num = (v) => (v === '' || v == null ? undefined : Number(v))

/* The in-app Store (frames, Lucky ID, entry effects, garage vehicles, room
   skins) — store_items, see sabalive migrations 20260924100000 and
   20261002130000. The panel manages the catalog; the app reads it live. */
export const STORE_CATEGORIES = {
  frame: {
    label: 'Frames', singular: 'Frame', icon: 'frame',
    blurb: 'Profile frames users buy in the Store → Frame tab.',
  },
  vip: {
    label: 'Lucky ID', singular: 'Lucky ID tier', icon: 'star',
    blurb: 'The tiers sold in the Store → Lucky ID tab. A purchase auto-equips and shows as a badge on the profile.',
  },
  entry_effect: {
    label: 'Entry Effects', singular: 'Entry effect', icon: 'userPlus',
    blurb: 'Played on screen for everyone in a live room when a user who equipped it walks in.',
  },
  vehicle: {
    label: 'Garage', singular: 'Vehicle', icon: 'briefcase',
    blurb: 'The vehicles in the Store → Garage tab. An equipped vehicle drives in on screen when its owner enters a live room.',
  },
  room_skin: {
    label: 'Room Skins', singular: 'Room skin', icon: 'layers',
    blurb: 'Background for a host\'s audio room. A host equips one in their Bag and every room they host uses it.',
  },
}
export const STORE_CATEGORY_KEYS = Object.keys(STORE_CATEGORIES)
export const STORE_STATUSES = ['active', 'inactive']

const row = (r) => ({
  id: r.id,
  idShort: shortId(r.id),
  category: r.category,
  name: r.name,
  emoji: r.emoji,
  assetUrl: r.asset_url,
  price: r.price_coins,
  days: r.duration_days,
  status: r.status === 'active' ? 'Active' : 'Inactive',
  sort: r.sort_order,
})

export async function listStoreItems(category) {
  const rows = unwrap(await supabase.from('store_items')
    .select('id, category, name, emoji, asset_url, price_coins, duration_days, status, sort_order')
    .eq('category', category)
    .order('sort_order').order('price_coins'))
  return rows.map(row)
}

const validate = (v) => {
  if (!String(v.name || '').trim()) throw new Error('Name is required')
  const price = num(v.price_coins)
  if (!(price > 0)) throw new Error('Price must be greater than 0')
  const days = num(v.duration_days)
  if (!(days > 0)) throw new Error('Duration must be at least 1 day')
}

export async function createStoreItem(category, v) {
  validate(v)
  return unwrap(await supabase.from('store_items').insert({
    category,
    name: v.name.trim(),
    emoji: (v.emoji || '').trim() || '🎁',
    asset_url: v.asset_url || null,
    price_coins: num(v.price_coins),
    duration_days: num(v.duration_days),
    status: (v.status || 'active').toLowerCase(),
    sort_order: num(v.sort_order) ?? 0,
  }).select().single())
}

export async function updateStoreItem(id, v) {
  const patch = {}
  if (v.name !== undefined) patch.name = String(v.name).trim()
  if (v.emoji !== undefined) patch.emoji = String(v.emoji).trim() || '🎁'
  if (v.asset_url !== undefined) patch.asset_url = v.asset_url || null
  if (v.price_coins !== undefined) patch.price_coins = num(v.price_coins)
  if (v.duration_days !== undefined) patch.duration_days = num(v.duration_days)
  if (v.status !== undefined) patch.status = String(v.status).toLowerCase()
  if (v.sort_order !== undefined) patch.sort_order = num(v.sort_order) ?? 0
  if (patch.name === '') throw new Error('Name is required')
  if (patch.price_coins !== undefined && !(patch.price_coins > 0)) throw new Error('Price must be greater than 0')
  if (patch.duration_days !== undefined && !(patch.duration_days > 0)) throw new Error('Duration must be at least 1 day')
  return unwrap(await supabase.from('store_items').update(patch).eq('id', id).select().single())
}

/* Deleting also takes the item out of every user's Bag (user_items cascades) —
   disabling it instead only hides it from the Store. */
export async function deleteStoreItem(id) {
  const { error } = await supabase.from('store_items').delete().eq('id', id)
  if (error) throw error
}

/* How many users currently own an unexpired copy — shown before a delete. */
export async function countOwners(id) {
  const { count, error } = await supabase.from('user_items')
    .select('id', { count: 'exact', head: true })
    .eq('item_id', id)
    .gt('expires_at', new Date().toISOString())
  if (error) throw error
  return count || 0
}
