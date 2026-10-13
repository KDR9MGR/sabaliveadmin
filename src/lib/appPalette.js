/* A preview of the colours the consumer app derives from the two colours set in Application Config
   (Brand / Accent). It mirrors AppPalette.fromBrand in the app (sabalive/lib/theme/app_palette.dart):
   the dark backgrounds are the brand's hue turned down to almost black, the purples are the brand
   itself lifted or deepened, and the default brand + accent give the app's original colours. */

export const DEFAULT_BRAND = '#7c3aed'
export const DEFAULT_ACCENT = '#f5279b'

const STOCK = {
  bg: '#0b0716', bgElevated: '#130c24', surface: '#1a1230', surfaceAlt: '#221743',
  card: '#1e1638', stroke: '#2e2352', primary: '#9b3df5', primaryDeep: '#6d28d9',
  primaryBright: '#b25cff', accent: '#f5279b',
}

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

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  const to = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

/* Returns null while a colour is not a readable hex yet (the field is being typed). */
export function appPalette(brandHex, accentHex) {
  const brand = norm(brandHex), accent = norm(accentHex)
  if (!brand || !accent) return null
  if (brand === DEFAULT_BRAND && accent === DEFAULT_ACCENT) return { ...STOCK }
  const { h, s: s0, l: l0 } = hexToHsl(brand)
  const l = clamp(l0, 0.45, 0.66)
  // a grey or white brand has no hue to tint with: its backgrounds stay neutral instead of turning red
  const s = s0 < 0.1 ? s0 : clamp(s0, 0.45, 1)
  const tintK = clamp(s0 / 0.4, 0, 1)
  const tint = (sat, light) => hslToHex(h, sat * tintK, light)
  return {
    bg: tint(0.52, 0.057), bgElevated: tint(0.55, 0.095), surface: tint(0.45, 0.13),
    surfaceAlt: tint(0.49, 0.176), card: tint(0.44, 0.153), stroke: tint(0.34, 0.23),
    primary: hslToHex(h, s, l),
    primaryDeep: hslToHex(h, s, clamp(l - 0.1, 0.3, 0.6)),
    primaryBright: hslToHex(h, s, clamp(l + 0.08, 0.5, 0.78)),
    accent,
  }
}
