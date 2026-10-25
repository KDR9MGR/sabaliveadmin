import { supabase } from './supabase.js'
import { isMissingFunction } from './dbErrors.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }

/* Wealth and Charm levels: each track has its own XP needed per level and its own
   level image (track_levels, sabalive migration 20261004100000). The image plays
   full-screen in a live room when a user who reached that level joins. */
export const LEVEL_TRACKS = ['Wealth', 'Charm']

export async function listTrackLevels(track) {
  const rows = unwrap(await supabase.from('track_levels')
    .select('level, xp_required, image_url').eq('track', track).order('level').limit(1000))
  return rows.map((r, i) => ({
    id: r.level,
    level: r.level,
    xp: r.xp_required,
    step: i === 0 ? 0 : r.xp_required - rows[i - 1].xp_required,
    image: r.image_url || '',
  }))
}

/* Saves one level's XP and image. `shift`: when the new XP reaches the next level, move every later level up by the same amount instead of refusing
   (admin_save_track_level_v2, sabalive migration 20261025110000). Returns how many later levels moved. While that migration is not on the
   project it falls back to the strict old function (XP must stay between the neighbours). */
export async function saveTrackLevel(track, { level, xp, image, shift = false }) {
  const { data, error } = await supabase.rpc('admin_save_track_level_v2', {
    p_track: track, p_level: Number(level), p_xp: Number(xp), p_image_url: image || null, p_shift: !!shift,
  })
  if (!error) return Number(data) || 0
  if (!isMissingFunction(error)) throw error
  if (shift) throw new Error('Moving the later levels needs the latest database update, which is not applied on this project yet.')
  const old = await supabase.rpc('admin_save_track_level', {
    p_track: track, p_level: Number(level), p_xp: Number(xp), p_image_url: image || null,
  })
  if (old.error) throw old.error
  return 0
}

export async function deleteTrackLevel(track, level) {
  const { error } = await supabase.rpc('admin_delete_track_level', { p_track: track, p_level: Number(level) })
  if (error) throw error
}
