import { supabase } from './supabase.js'
import { MISSING, checkProduct, vipError } from './vipProducts.js'

/* The database calls of the VIP Products page (sabalive migration 20261106120000). The rules they apply are in vipProducts.js. */

const toProduct = (r) => ({
  id: r.id,
  name: r.name,
  tagline: r.tagline || '',
  badge_url: r.badge_url || '',
  price_coins: r.price_coins,
  duration_days: r.duration_days,
  status: r.status,
  statusLabel: r.status === 'active' ? 'Active' : 'Inactive',
  sort_order: r.sort_order ?? 0,
  benefits: (r.vip_product_benefits || []).map((b) => ({
    id: b.id, kind: b.kind, title: b.title || '', image_url: b.image_url || '', link_item_id: b.link_item_id || '', sort_order: b.sort_order ?? 0,
    // the linked Store item was made from this benefit's own picture (status 'vip_only', sabalive migration 20261114120000)
    link_vip_only: b.store_items?.status === 'vip_only',
  })),
  owners: r.user_vip?.[0]?.count ?? 0,
})

/* All products (a Master / Super Admin also reads the hidden ones) with their benefits and how many people hold each right now.
   { available: false } while the tables are not on this project. */
export async function listVipProducts() {
  const { data, error } = await supabase
    .from('vip_products')
    .select('id, name, tagline, badge_url, price_coins, duration_days, status, sort_order, vip_product_benefits(id, kind, title, image_url, link_item_id, sort_order, store_items(status)), user_vip(count)')
    .gt('user_vip.expires_at', new Date().toISOString())
    .order('sort_order')
    .order('price_coins')
  if (error) {
    if (MISSING.test(error.message || '')) return { available: false, products: [] }
    throw error
  }
  return { available: true, products: data.map(toProduct) }
}

/* Creates (id null) or changes a product together with its benefits. Returns the product id. */
export async function saveVipProduct(id, v) {
  const checked = checkProduct(v)
  if (checked.error) throw new Error(checked.error)
  const p = checked.product
  const { data, error } = await supabase.rpc('admin_save_vip_product', {
    p_id: id || null, p_name: p.name, p_tagline: p.tagline, p_badge_url: p.badge_url, p_price: p.price_coins, p_days: p.duration_days,
    p_status: p.status, p_sort: p.sort_order, p_benefits: p.benefits,
  })
  if (error) throw new Error(vipError(error))
  return data
}

/* Deletes a product. Returns how many people held it. */
export async function deleteVipProduct(id) {
  const { data, error } = await supabase.rpc('admin_delete_vip_product', { p_id: id })
  if (error) throw new Error(vipError(error))
  return data
}

/* The Store items a benefit can give: frames, entry effects, vehicles and room skins (never Lucky IDs), by category. Items made from a benefit's own picture (status 'vip_only') belong
   to their benefit and are not offered for another one. */
export async function listLinkableItems() {
  const { data, error } = await supabase
    .from('store_items')
    .select('id, category, name, emoji, status')
    .neq('status', 'vip_only')
    .in('category', ['frame', 'entry_effect', 'vehicle', 'room_skin'])
    .order('category')
    .order('sort_order')
    .order('name')
  if (error) throw error
  const byCategory = {}
  for (const r of data) (byCategory[r.category] ||= []).push({ id: r.id, name: r.name, emoji: r.emoji || '', inactive: r.status !== 'active' })
  return byCategory
}
