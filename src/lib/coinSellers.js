import { supabase } from './supabase.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }

/* Offline coin sellers (the app's Coin Seller list). Each can be linked to an app
   user, so the app shows their photo, name, app ID and level beside a WhatsApp
   button. Table: offline_coin_sellers (sabalive migrations 20260924140000 and
   20261004110000). */
export const waLink = (number) => {
  const digits = String(number || '').replace(/[^0-9]/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}

export async function listSellers() {
  const rows = unwrap(await supabase.from('offline_coin_sellers')
    .select('id, name, whatsapp_number, note, active, sort_order, profile_id, profile:profile_id(name, username, display_id, avatar_url, level)')
    .order('sort_order').order('created_at'))
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    whatsapp: r.whatsapp_number,
    note: r.note || '',
    active: r.active,
    status: r.active ? 'Active' : 'Inactive',
    sort: r.sort_order,
    profileId: r.profile_id,
    username: r.profile?.username || '',
    displayId: r.profile?.display_id ?? '',
    level: r.profile?.level ?? '',
    avatar: r.profile?.avatar_url || '',
    userName: r.profile?.name || '',
  }))
}

export async function saveSeller({ id, profile_id, name, whatsapp_number, note, active, sort_order }) {
  const row = {
    profile_id: profile_id || null,
    name: String(name || '').trim(),
    whatsapp_number: String(whatsapp_number || '').trim(),
    note: String(note || '').trim() || null,
    active: !!active,
    sort_order: Number(sort_order) || 0,
  }
  if (!row.name) throw new Error('Name is required')
  if (!row.whatsapp_number.replace(/[^0-9]/g, '')) throw new Error('A WhatsApp number is required (with country code)')
  const q = id
    ? supabase.from('offline_coin_sellers').update(row).eq('id', id)
    : supabase.from('offline_coin_sellers').insert(row)
  const { error } = await q
  if (error) throw error
}

export async function setSellerActive(id, active) {
  const { error } = await supabase.from('offline_coin_sellers').update({ active }).eq('id', id)
  if (error) throw error
}

export async function deleteSeller(id) {
  const { error } = await supabase.from('offline_coin_sellers').delete().eq('id', id)
  if (error) throw error
}

/* Users a seller can be linked to. */
export async function sellerUserOptions() {
  const rows = unwrap(await supabase.from('profiles')
    .select('id, name, username, display_id, phone').eq('is_ghost', false).order('name').limit(2000))
  return rows.map((p) => ({
    value: p.id,
    label: `${p.name} (@${p.username}) · ID ${p.display_id}`,
    search: `${p.name} ${p.username} ${p.display_id}`.toLowerCase(),
    name: p.name,
    phone: p.phone || '',
  }))
}
