import { supabase } from './supabase.js'
import { MISSING, checkTag, tagError } from './profileTags.js'

/* The database calls of the Tags page (sabalive migration 20261021190000). The rules they apply are in profileTags.js. */

const unwrap = ({ data, error }) => { if (error) throw error; return data }

const toTag = (r) => ({
  id: r.id, name: r.name, color: r.color, emoji: r.emoji || '', status: r.status, sort_order: r.sort_order ?? 0,
  look: r.look || 'pill', image_url: r.image_url || '', text_color: r.text_color || '',
  users: r.profile_tag_assignments?.[0]?.count ?? 0,
})

/* All tags with how many users hold each. { available: false } while the tables are not on this project. */
export async function listTags() {
  const { data, error } = await supabase.from('profile_tags')
    .select('id, name, color, emoji, status, sort_order, look, image_url, text_color, profile_tag_assignments(count)')
    .order('sort_order').order('name')
  if (error) {
    if (MISSING.test(error.message || '')) return { available: false, tags: [] }
    throw error
  }
  return { available: true, tags: data.map(toTag) }
}

export async function saveTag(id, v) {
  const checked = checkTag(v)
  if (checked.error) throw new Error(checked.error)
  const t = checked.tag
  const { error } = await supabase.rpc('admin_save_profile_tag', {
    p_id: id || null, p_name: t.name, p_color: t.color, p_emoji: t.emoji, p_status: t.status, p_sort: t.sort_order,
    p_look: t.look, p_image_url: t.image_url, p_text_color: t.text_color,
  })
  if (error) throw new Error(tagError(error))
}

/* Returns how many users had it. */
export async function deleteTag(id) {
  const { data, error } = await supabase.rpc('admin_delete_profile_tag', { p_id: id })
  if (error) throw new Error(tagError(error))
  return data
}

export async function getUserTagIds(userId) {
  return unwrap(await supabase.from('profile_tag_assignments').select('tag_id').eq('profile_id', userId)).map((r) => r.tag_id)
}

export async function setUserTags(userId, tagIds) {
  const { error } = await supabase.rpc('admin_set_user_tags', { p_user: userId, p_tag_ids: tagIds })
  if (error) throw new Error(tagError(error))
}

/* Finds users by name or by their app ID, 15 at a time (the profiles rules decide who is visible). */
export async function searchUsers(text) {
  const q = String(text || '').trim().replace(/[,()*%]/g, '')
  if (q.length < 2) return []
  const asId = /^\d+$/.test(q) ? Number(q) : null
  const filter = asId != null ? `display_id.eq.${asId},name.ilike.%${q}%` : `name.ilike.%${q}%,username.ilike.%${q}%`
  const rows = unwrap(await supabase.from('profiles').select('id, name, username, display_id, avatar_url').or(filter).limit(15))
  return rows.map((p) => ({ id: p.id, name: p.name, username: p.username, displayId: p.display_id, avatar: p.avatar_url }))
}
