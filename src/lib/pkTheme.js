/* The PK look the panel sets (PK Battles -> Look and colours): the colour of each side, an accent, whether the PK animations play, an
   optional big intro, the style of the lose badge, and the two colours of the gradient behind the VIDEO PK stage. Stored as one small JSON object in app_config.pk_theme (sabalive migration
   20261020100000); the consumer app reads it live. Pure functions only (the page and the tests use them); the colour maths is the SAME
   as the app's (sabalive/lib/state/pk_theme_store.dart) so the preview here shows what phones will show. */

export const PK_THEME_DEFAULT = Object.freeze({
  mine: '#ff2d55',
  theirs: '#2d6bff',
  accent: '#ffc93c',
  bg_top: '#33104f',
  bg_bottom: '#0b1636',
  animations: true,
  hero_intro: false,
  lose_style: 'shield',
})

export const LOSE_STYLES = [
  { value: 'shield', label: 'Shield (LOSE, like the WIN and DRAW badges)' },
  { value: 'emoji', label: 'Crying face on a ribbon' },
]

/* The hue of the red / blue animation art in the app's files; a chosen colour is shown by turning the art's hue to the colour's hue. */
export const MINE_ART_HUE = 3
export const THEIRS_ART_HUE = 203

/* '#abc', '#AABBCC' or 'aabbcc' -> '#aabbcc'; anything else -> null. */
export function normalizeHex(text) {
  if (typeof text !== 'string') return null
  let h = text.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('')
  return /^[0-9a-fA-F]{6}$/.test(h) ? `#${h.toLowerCase()}` : null
}

/* What the page shows for a saved value: the default for anything missing or unreadable (the same leniency as the app). */
export function readPkTheme(json) {
  const d = PK_THEME_DEFAULT
  if (!json || typeof json !== 'object' || Array.isArray(json)) return { ...d }
  return {
    mine: normalizeHex(json.mine) || d.mine,
    theirs: normalizeHex(json.theirs) || d.theirs,
    accent: normalizeHex(json.accent) || d.accent,
    bg_top: normalizeHex(json.bg_top) || d.bg_top,
    bg_bottom: normalizeHex(json.bg_bottom) || d.bg_bottom,
    animations: typeof json.animations === 'boolean' ? json.animations : d.animations,
    hero_intro: typeof json.hero_intro === 'boolean' ? json.hero_intro : d.hero_intro,
    lose_style: json.lose_style === 'emoji' ? 'emoji' : 'shield',
  }
}

export const isDefaultTheme = (t) => {
  const d = PK_THEME_DEFAULT
  return t.mine === d.mine && t.theirs === d.theirs && t.accent === d.accent && t.bg_top === d.bg_top && t.bg_bottom === d.bg_bottom && t.animations === d.animations && t.hero_intro === d.hero_intro && t.lose_style === d.lose_style
}

/* The form's values -> what to save: { theme } (null = the built-in look, which clears the column) or { error } naming the field. */
export function checkPkTheme(v) {
  const out = {}
  for (const [key, label] of [['mine', 'My side colour'], ['theirs', 'Opponent side colour'], ['accent', 'Accent colour'], ['bg_top', 'Video background (top) colour'], ['bg_bottom', 'Video background (bottom) colour']]) {
    const hex = normalizeHex(v?.[key])
    if (!hex) return { error: `${label} must be a colour like #ff2d55.` }
    out[key] = hex
  }
  out.animations = !!v?.animations
  out.hero_intro = !!v?.hero_intro
  if (v?.lose_style !== 'shield' && v?.lose_style !== 'emoji') return { error: 'Choose a lose badge style.' }
  out.lose_style = v.lose_style
  return { theme: isDefaultTheme(out) ? null : out }
}

// ------------------------------------------------------------------------------------------------------------------- colour maths
const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
const toHex = (rgb) => `#${rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('')}`
const mix = (a, b, t) => toHex(toRgb(a).map((c, i) => c + (toRgb(b)[i] - c) * t))

function rgbToHsl([r, g, b]) {
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const l = (max + min) / 2; const d = max - min
  let h = 0; let s = 0
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [h, s, l]
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs(((h / 60) % 2) - 1)); const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return toHex([r + m, g + m, b + m])
}

/* The hue of a colour, in degrees. */
export const hueOf = (hex) => rgbToHsl(toRgb(hex))[0]

/* The degrees the app turns a side's animation art by to show this colour (0 while the colour is the built-in one), the short way round. */
export function hueShift(hex, team) {
  const d = PK_THEME_DEFAULT
  if (hex === (team === 'mine' ? d.mine : d.theirs)) return 0
  const delta = hueOf(hex) - (team === 'mine' ? MINE_ART_HUE : THEIRS_ART_HUE)
  return ((((delta + 540) % 360) + 360) % 360) - 180
}

/* A side's half of the audio arena, top and bottom colour (the built-in colours exactly; a chosen colour gets a deep and a darker shade). */
export function halfColors(hex, team) {
  const d = PK_THEME_DEFAULT
  if (team === 'mine' && hex === d.mine) return ['#b1122b', '#3a0a16']
  if (team === 'theirs' && hex === d.theirs) return ['#11489b', '#0a1b3a']
  const [h, s0, ] = rgbToHsl(toRgb(hex))
  const s = Math.min(s0, 0.85)
  return [hslToHex(h, s, 0.36), hslToHex(h, s * 0.85, 0.12)]
}

/* A side's plain bar: left-to-right colours as the app draws them. */
export function barColors(hex, team) {
  const d = PK_THEME_DEFAULT
  if (team === 'mine' && hex === d.mine) return ['#ff2d55', '#ff7a9c']
  if (team === 'theirs' && hex === d.theirs) return ['#9cc6ff', '#2d6bff']
  const light = mix(hex, '#ffffff', 0.45)
  return team === 'mine' ? [hex, light] : [light, hex]
}

/* The clock pill / label gradient: the built-in gold unless the accent was changed. */
export function accentGradient(hex) {
  if (hex === PK_THEME_DEFAULT.accent) return ['#ffe08a', '#ffc93c', '#f5a623']
  return [mix(hex, '#ffffff', 0.4), hex, mix(hex, '#000000', 0.22)]
}
