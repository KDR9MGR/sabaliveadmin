/* A preview of the colours the consumer app derives from the two colours and the background tone set in Application Config
   (Brand / Accent / Background tone). It mirrors AppPalette.fromBrand in the app (sabalive/lib/theme/app_palette.dart): the backgrounds
   are the brand's hue at the brightness of the tone (Deep = almost black, Rich = clearly coloured, the default, Soft = the lightest the
   app's fixed light text can sit on), the purples are the brand itself lifted or deepened, and the default brand + accent keep the
   app's original violet and pink. Rich and Soft pick the lightness so every hue has the same brightness (relative luminance), exactly as the app does. */

export const DEFAULT_BRAND = '#7c3aed'
export const DEFAULT_ACCENT = '#f5279b'

const STOCK = {
  bg: '#0b0716', bgElevated: '#130c24', surface: '#1a1230', surfaceAlt: '#221743',
  card: '#1e1638', stroke: '#2e2352', primary: '#9b3df5', primaryDeep: '#6d28d9',
  primaryBright: '#b25cff', accent: '#f5279b',
}

export const TONES = ['deep', 'rich', 'soft']
export const DEFAULT_TONE = 'rich'
export const TONE_LABELS = { deep: 'Deep (almost black)', rich: 'Rich (coloured, default)', soft: 'Soft (lighter)' }
export const parseTone = (v) => { const t = String(v || '').trim().toLowerCase(); return TONES.includes(t) ? t : DEFAULT_TONE }

/* target brightness (relative luminance) of each surface, by tone; Deep uses the original fixed HSL values */
const LUMINANCE = {
  rich: { bg: 0.026, bgElevated: 0.034, surface: 0.043, surfaceAlt: 0.056, card: 0.049, stroke: 0.078 },
  soft: { bg: 0.06, bgElevated: 0.072, surface: 0.085, surfaceAlt: 0.105, card: 0.092, stroke: 0.14 },
}
const SAT = { bg: 0.55, bgElevated: 0.55, surface: 0.5, surfaceAlt: 0.52, card: 0.5, stroke: 0.42 }

const norm = (hex) => {
  const h = String(hex || '').trim().replace('#', '')
  if (/^[0-9a-f]{3}$/i.test(h)) return `#${h.split('').map((c) => c + c).join('').toLowerCase()}`
  return /^[0-9a-f]{6}$/i.test(h) ? `#${h.toLowerCase()}` : null
}

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0, s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    else if (max === g) h = ((b - r) / d + 2) * 60
    else h = ((r - g) / d + 4) * 60
  }
  return { h, s, l }
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [r + m, g + m, b + m]
}

function hslToHex(h, s, l) {
  const to = (v) => Math.round(v * 255).toString(16).padStart(2, '0')
  const [r, g, b] = hslToRgb(h, s, l)
  return `#${to(r)}${to(g)}${to(b)}`
}

/* WCAG relative luminance, as Flutter's Color.computeLuminance */
const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

/* The colour of this hue and saturation whose luminance is `target`: the HSL lightness found by halving (24 steps), the same search as the app */
function atLuminance(h, s, target) {
  let lo = 0, hi = 0.9
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (luminance(hslToRgb(h, s, mid)) < target) lo = mid
    else hi = mid
  }
  return hslToHex(h, s, (lo + hi) / 2)
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

/* Returns null while a colour is not a readable hex yet (the field is being typed). */
export function appPalette(brandHex, accentHex, toneValue = DEFAULT_TONE) {
  const brand = norm(brandHex), accent = norm(accentHex)
  if (!brand || !accent) return null
  const tone = parseTone(toneValue)
  const isDefault = brand === DEFAULT_BRAND && accent === DEFAULT_ACCENT
  if (isDefault && tone === 'deep') return { ...STOCK }
  const { h, s: s0, l: l0 } = hexToHsl(brand)
  const l = clamp(l0, 0.45, 0.66)
  // a grey or white brand has no hue to tint with: its backgrounds stay neutral instead of turning red
  const s = s0 < 0.1 ? s0 : clamp(s0, 0.45, 1)
  const tintK = clamp(s0 / 0.4, 0, 1)
  const tint = (sat, light) => hslToHex(h, sat * tintK, light)
  const shade = (name) => atLuminance(h, SAT[name] * tintK, LUMINANCE[tone][name])
  const deep = tone === 'deep'
  return {
    bg: deep ? tint(0.52, 0.057) : shade('bg'),
    bgElevated: deep ? tint(0.55, 0.095) : shade('bgElevated'),
    surface: deep ? tint(0.45, 0.13) : shade('surface'),
    surfaceAlt: deep ? tint(0.49, 0.176) : shade('surfaceAlt'),
    card: deep ? tint(0.44, 0.153) : shade('card'),
    stroke: deep ? tint(0.34, 0.23) : shade('stroke'),
    // the default brand keeps the original violet whatever the tone
    primary: isDefault ? STOCK.primary : hslToHex(h, s, l),
    primaryDeep: isDefault ? STOCK.primaryDeep : hslToHex(h, s, clamp(l - 0.1, 0.3, 0.6)),
    primaryBright: isDefault ? STOCK.primaryBright : hslToHex(h, s, clamp(l + 0.08, 0.5, 0.78)),
    accent,
  }
}
