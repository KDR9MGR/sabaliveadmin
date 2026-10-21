import { normalizeHex } from './pkTheme.js'

/* Staff tags (Master -> Tags): short labels with a colour that are given to users by hand and show on their profile in the app.
   Database: sabalive migration 20261021190000 (profile_tags, profile_tag_assignments, admin_save_profile_tag, admin_delete_profile_tag,
   admin_set_user_tags). The pure checks below are the SAME rules the database applies, so a mistake is caught before it is sent.
   Only pure functions here (the tests use them); the database calls are in profileTagsApi.js. */

export const TAG_NAME_MAX = 24
export const TAG_EMOJI_MAX = 12
export const MAX_TAGS_PER_USER = 10
export const TAG_DEFAULT_COLOR = '#7c3aed'
/* The three looks of a tag (owner's choice, 2026-10-21): a coloured pill, a picture that already has the name in it, or a background picture the app
   writes the name on. */
export const TAG_LOOKS = [
  { value: 'pill', label: 'Coloured pill (the name on a colour)' },
  { value: 'picture', label: 'Picture with the name inside it (shown as it is)' },
  { value: 'plate', label: 'Background picture, the app writes the name on it' },
]
export const TAG_IMAGE_ACCEPT = '.png,.webp,.gif,.jpg,.jpeg,image/png,image/webp,image/gif,image/jpeg'
export const TAG_STATUSES = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive (hidden, cannot be given)' }]

const chars = (s) => Array.from(s).length

/* The form's values -> { tag } ready for admin_save_profile_tag, or { error } in a sentence. */
export function checkTag(v) {
  const name = String(v?.name ?? '').trim()
  if (!name) return { error: 'Give the tag a name.' }
  if (chars(name) > TAG_NAME_MAX) return { error: `A tag name is at most ${TAG_NAME_MAX} characters.` }
  const color = normalizeHex(v?.color)
  if (!color) return { error: 'Pick a colour like #7c3aed.' }
  const emoji = String(v?.emoji ?? '').trim()
  if (chars(emoji) > TAG_EMOJI_MAX) return { error: 'The emoji is too long: use one emoji.' }
  const status = v?.status === 'inactive' ? 'inactive' : 'active'
  const sortRaw = v?.sort_order === '' || v?.sort_order == null ? 0 : Number(v.sort_order)
  if (!Number.isInteger(sortRaw)) return { error: 'The order must be a whole number.' }
  const look = TAG_LOOKS.some((l) => l.value === v?.look) ? v.look : 'pill'
  const image = String(v?.image_url ?? '').trim()
  if (look !== 'pill' && !image) return { error: 'Upload a picture for this look, or choose the coloured pill.' }
  if (look !== 'pill' && !/^https:\/\//i.test(image)) return { error: 'The picture must be an uploaded file.' }
  const textRaw = String(v?.text_color ?? '').trim()
  const textColor = textRaw ? normalizeHex(textRaw) : null
  if (textRaw && !textColor) return { error: 'The text colour must look like #ffffff, or be left empty.' }
  return { tag: { name, color, emoji: emoji || null, status, sort_order: sortRaw, look, image_url: look === 'pill' ? null : image, text_color: textColor } }
}

/* Readable text on a tag colour: dark ink on a light colour, white on a dark one (the app does the same). */
export function textColorFor(hex) {
  const h = normalizeHex(hex)
  if (!h) return '#ffffff'
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#1b1030' : '#ffffff'
}

/* The text colour a tag is drawn with: its own when one was set, white on a plate, else readable on the pill colour. */
export function tagTextColor(tag) {
  return normalizeHex(tag?.text_color) || (tag?.look === 'plate' ? '#ffffff' : textColorFor(tag?.color))
}

/* The tag ids to save for a user after ticking `id`, or null when that would go over the limit. */
export function toggleTag(current, id) {
  if (current.includes(id)) return current.filter((x) => x !== id)
  return current.length >= MAX_TAGS_PER_USER ? null : [...current, id]
}

/* Did the ticks change from what the user had? (order does not matter) */
export function sameTags(a, b) {
  return a.length === b.length && a.every((x) => b.includes(x))
}

export const MISSING = /profile_tag|schema cache|does not exist|could not find the (table|function)/i

/* A readable sentence for whatever the server said. */
export function tagError(e) {
  const m = e?.message || String(e || '')
  if (/permission denied|not allowed/i.test(m)) return 'You do not have Tags access.'
  if (MISSING.test(m)) return 'Tags are not installed on this project yet (they need the database update 20261021190000).'
  return m || 'Something went wrong.'
}
