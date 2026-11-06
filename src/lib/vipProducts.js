/* VIP products (Master / Super Admin -> VIP Products): the cards of the app's VIP screen. A product is a bundle: a name, a short line, a badge picture, a coin price, a number
   of days, and a list of benefits. Database: sabalive migration 20261106120000 (vip_products, vip_product_benefits, user_vip, admin_save_vip_product,
   admin_delete_vip_product, purchase_vip_product). The pure checks below are the SAME rules the database applies, so a mistake is caught before it is sent.
   Only pure functions here (the tests use them); the database calls are in vipApi.js. */

export const VIP_NAME_MAX = 40
export const VIP_TAGLINE_MAX = 120
export const VIP_BENEFIT_TITLE_MAX = 40
export const VIP_MAX_BENEFITS = 40
export const VIP_MAX_DAYS = 3650
export const VIP_CUSTOM = 'custom'
export const VIP_STATUSES = [{ value: 'active', label: 'Active (shown in the app, can be bought)' }, { value: 'inactive', label: 'Inactive (hidden, nobody can buy it)' }]
/* A badge or benefit picture can be a still picture, a GIF / WebP, an SVG drawing or an SVGA animation. */
export const VIP_IMAGE_ACCEPT = '.svga,.svg,.png,.webp,.gif,.jpg,.jpeg,image/png,image/webp,image/gif,image/jpeg,image/svg+xml'

/* The benefits the panel offers to tick, as in the owner's reference screenshot. The app has the SAME list (sabalive lib/features/vip/vip_kinds.dart): keep the two in step.
   `link` is the Store category whose items the buyer is GIVEN for the VIP's days; a kind without one is only LISTED on the product's page for now (its rule, such as
   Anti-Kick or Anti-Ban, is switched on later, one at a time). `identity` is the product's badge, shown on the person's own profile. */
export const VIP_KINDS = [
  { key: 'identity', label: 'Identity', link: null, gives: 'The badge picture above shows on the person\'s own profile while the VIP is active.' },
  { key: 'entry_effect', label: 'Entry Effect', link: 'entry_effect', gives: 'Gives the chosen entry effect for the VIP\'s days.' },
  { key: 'vehicle', label: 'Vehicle', link: 'vehicle', gives: 'Gives the chosen vehicle for the VIP\'s days.' },
  { key: 'avatar_frame', label: 'Avatar Frame', link: 'frame', gives: 'Gives the chosen frame for the VIP\'s days.' },
  { key: 'join_entry_effect', label: 'Join Entry Effect', link: null },
  { key: 'comment_box', label: 'Comment Box', link: null },
  { key: 'special_gift', label: 'Special Gift', link: null },
  { key: 'theme', label: 'Theme', link: 'room_skin', gives: 'Gives the chosen room skin for the VIP\'s days.' },
  { key: 'hide_country', label: 'Hide Country', link: null },
  { key: 'short_profile_decoration', label: 'Short Profile Decoration', link: null },
  { key: 'special_global_gift_effect', label: 'Special Global Gift Effect', link: null },
  { key: 'colourful_user_name', label: 'Colourful User Name', link: null },
  { key: 'video_call_frame', label: 'Video Call Frame', link: null },
  { key: 'high_speed_upgrade', label: 'High Speed Upgrade', link: null },
  { key: 'higher_rank', label: 'Higher Rank', link: null },
  { key: 'daily_check_in', label: 'Daily Check In', link: null },
  { key: 'guardian', label: 'Guardian', link: null },
  { key: 'anti_kick', label: 'Anti-Kick', link: null },
  { key: 'anti_ban', label: 'Anti-Ban', link: null },
]
export const VIP_KIND_KEYS = VIP_KINDS.map((k) => k.key)
export const vipKind = (key) => VIP_KINDS.find((k) => k.key === key) || null

/* Does this kind give a Store item when linked, or only get listed? */
export const kindGives = (key) => !!vipKind(key)?.gives

const chars = (s) => Array.from(String(s ?? '')).length
const isUpload = (u) => /^https:\/\//i.test(String(u || ''))

/* The form's values -> { product } ready for admin_save_vip_product, or { error } in a sentence.
   v.benefits is the list of { kind, title, image_url, link_item_id } in the order to show. */
export function checkProduct(v) {
  const name = String(v?.name ?? '').trim()
  if (!name) return { error: 'Give the VIP a name.' }
  if (chars(name) > VIP_NAME_MAX) return { error: `A VIP name is at most ${VIP_NAME_MAX} characters.` }
  const tagline = String(v?.tagline ?? '').trim()
  if (chars(tagline) > VIP_TAGLINE_MAX) return { error: `The short line is at most ${VIP_TAGLINE_MAX} characters.` }
  const badge = String(v?.badge_url ?? '').trim()
  if (badge && !isUpload(badge)) return { error: 'The badge must be an uploaded file.' }
  const price = Number(String(v?.price_coins ?? '').trim() === '' ? NaN : v.price_coins)
  if (!Number.isInteger(price) || price < 1) return { error: 'The price must be a whole number of coins, at least 1.' }
  const days = Number(String(v?.duration_days ?? '').trim() === '' ? NaN : v.duration_days)
  if (!Number.isInteger(days) || days < 1 || days > VIP_MAX_DAYS) return { error: `The days must be a whole number from 1 to ${VIP_MAX_DAYS}.` }
  const sortRaw = v?.sort_order === '' || v?.sort_order == null ? 0 : Number(v.sort_order)
  if (!Number.isInteger(sortRaw)) return { error: 'The order must be a whole number.' }
  const status = v?.status === 'inactive' ? 'inactive' : 'active'

  const list = Array.isArray(v?.benefits) ? v.benefits : []
  if (list.length > VIP_MAX_BENEFITS) return { error: `A VIP can have at most ${VIP_MAX_BENEFITS} benefits.` }
  const seen = new Set()
  const benefits = []
  for (const b of list) {
    const kind = String(b?.kind ?? '').trim().toLowerCase()
    if (!/^[a-z][a-z0-9_]{1,39}$/.test(kind)) return { error: 'A benefit has no valid kind.' }
    const title = String(b?.title ?? '').trim()
    if (kind === VIP_CUSTOM && !title) return { error: 'Give every custom benefit a title.' }
    if (chars(title) > VIP_BENEFIT_TITLE_MAX) return { error: `A benefit title is at most ${VIP_BENEFIT_TITLE_MAX} characters.` }
    if (kind !== VIP_CUSTOM) {
      if (seen.has(kind)) return { error: `"${vipKind(kind)?.label || kind}" is in the list twice.` }
      seen.add(kind)
    }
    const image = String(b?.image_url ?? '').trim()
    if (image && !isUpload(image)) return { error: 'A benefit picture must be an uploaded file.' }
    const link = String(b?.link_item_id ?? '').trim()
    if (link && !vipKind(kind)?.link) return { error: 'Only Entry Effect, Vehicle, Avatar Frame and Theme can give a Store item.' }
    benefits.push({ kind, title: title || null, image_url: image || null, link_item_id: link || null })
  }
  return {
    product: {
      name, tagline: tagline || null, badge_url: badge || null, price_coins: price, duration_days: days, status, sort_order: sortRaw, benefits,
    },
  }
}

/* A product row from the database (with its vip_product_benefits) -> the form's values. */
export function formFromProduct(p) {
  const rows = [...(p?.benefits || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  return {
    name: p?.name || '', tagline: p?.tagline || '', badge_url: p?.badge_url || '',
    price_coins: p?.price_coins ?? '', duration_days: p?.duration_days ?? 30,
    status: p?.status || 'active', sort_order: p?.sort_order ?? 0,
    benefits: rows.map((b) => ({ kind: b.kind, title: b.title || '', image_url: b.image_url || '', link_item_id: b.link_item_id || '' })),
  }
}

/* Tick / untick a fixed kind in the form's benefits: ticking adds it (after the ones already there), unticking removes it. Custom entries are not touched. */
export function toggleKind(benefits, key) {
  if (benefits.some((b) => b.kind === key)) return benefits.filter((b) => b.kind !== key)
  return [...benefits, { kind: key, title: '', image_url: '', link_item_id: '' }]
}

/* The benefits in the order the app shows them: the fixed kinds in the panel's list order, then the custom ones in the order they were added. */
export function orderBenefits(benefits) {
  const fixed = VIP_KIND_KEYS.map((k) => benefits.find((b) => b.kind === k)).filter(Boolean)
  const known = new Set(VIP_KIND_KEYS)
  // a kind this panel does not know (made by a newer panel) is kept, after the fixed ones and before the custom ones
  const other = benefits.filter((b) => b.kind !== VIP_CUSTOM && !known.has(b.kind))
  return [...fixed, ...other, ...benefits.filter((b) => b.kind === VIP_CUSTOM)]
}

export const MISSING = /vip_product|user_vip|admin_save_vip|admin_delete_vip|schema cache|does not exist|could not find the (table|function)/i

/* A readable sentence for whatever the server said. */
export function vipError(e) {
  const m = e?.message || String(e || '')
  if (/only a master or (a )?super admin/i.test(m)) return 'Only a Master or Super Admin can manage VIP products.'
  if (/permission denied|not allowed/i.test(m)) return 'You do not have access to VIP products.'
  if (MISSING.test(m)) return 'VIP products are not installed on this project yet (they need the database update 20261106120000).'
  return m || 'Something went wrong.'
}
