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

/* Saves one level's XP and image: exactly the XP given, with no relation to the level before or after it (admin_save_track_level_v3, sabalive migration
   20261025140000). On a project that does not have that migration yet it falls back to v2 (a level must stay below the next one), then to the first
   version (strictly between its neighbours), so the page keeps working and the database's own refusal is what the person reads. */
export async function saveTrackLevel(track, { level, xp, image }) {
  const base = { p_track: track, p_level: Number(level), p_xp: Number(xp), p_image_url: image || null }
  const attempts = [
    ['admin_save_track_level_v3', base],
    ['admin_save_track_level_v2', { ...base, p_shift: false }],
    ['admin_save_track_level', base],
  ]
  for (const [fn, args] of attempts) {
    const { error } = await supabase.rpc(fn, args)
    if (!error) return
    if (!isMissingFunction(error)) throw error
  }
  throw new Error('Saving a level needs a database update that is not applied on this project yet.')
}

export async function deleteTrackLevel(track, level) {
  const { error } = await supabase.rpc('admin_delete_track_level', { p_track: track, p_level: Number(level) })
  if (error) throw error
}
