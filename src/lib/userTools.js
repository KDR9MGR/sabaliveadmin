import { supabase } from './supabase.js'

const rpc = async (fn, args) => { const { error } = await supabase.rpc(fn, args); if (error) throw error }

/* Master / Super Admin tools on a user's detail page (sabalive migration 20261004130000). */
export const assignStoreItem = (userId, itemId, days, equip) =>
  rpc('admin_assign_store_item', { p_user: userId, p_item: itemId, p_days: days ? Number(days) : null, p_equip: !!equip })

export const removeUserItem = (userItemId) => rpc('admin_remove_user_item', { p_user_item: userItemId })

export const updateUserProfile = (userId, v) => rpc('admin_update_user_profile', {
  p_user_id: userId,
  p_name: v.name,
  p_username: v.username,
  p_bio: v.bio ?? '',
  p_location: v.location || null,
  p_gender: v.gender ?? '',
  p_date_of_birth: v.date_of_birth || null,
  p_avatar_url: v.avatar_url || null,
  p_phone: v.phone ?? '',
})
