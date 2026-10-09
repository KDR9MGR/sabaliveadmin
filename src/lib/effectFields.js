/* Fields shared by gifts and store items (entry effects, vehicles): how fast the effect plays and an
   optional sound that plays with it on every phone in the room. Stored in gifts / store_items
   (play_speed, sound_url), see sabalive migration 20261009120000. */

/* Play speed: empty means "the app default" (0.75), otherwise 0.1 - 2 (1 = the file's own speed). */
export function checkSpeed(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0.1 || n > 2) throw new Error('Play speed must be between 0.1 and 2')
  return Math.round(n * 100) / 100
}

export const SPEED_FIELD = {
  name: 'play_speed', label: 'Play speed', type: 'number', step: 0.05, min: 0.1, max: 2, placeholder: '0.75',
  hint: "1 = the file's own speed. Leave empty for the app default (0.75, a quarter slower). 0.5 = half speed. Allowed 0.1 to 2.",
}

/* The "Sound" upload field: pass the upload function for the right folder. */
export const soundField = (onUpload, accept, hint) => ({
  name: 'sound_url', label: 'Sound (optional)', type: 'image', accept, full: true, clearable: true, onUpload,
  hint: `${hint}. Plays with the effect on every phone in the room; the video's own sound is then muted.`,
})

/* '0.75x' / 'default' for a table cell */
export const speedLabel = (s) => (s == null ? 'default (0.75x)' : `${s}x`)
