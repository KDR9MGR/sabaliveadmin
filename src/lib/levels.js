import { supabase } from './supabase.js'

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

export async function saveTrackLevel(track, { level, xp, image }) {
  const { error } = await supabase.rpc('admin_save_track_level', {
    p_track: track, p_level: Number(level), p_xp: Number(xp), p_image_url: image || null,
  })
  if (error) throw error
}

export async function deleteTrackLevel(track, level) {
  const { error } = await supabase.rpc('admin_delete_track_level', { p_track: track, p_level: Number(level) })
  if (error) throw error
}
