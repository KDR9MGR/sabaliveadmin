import { createContext, useContext, useEffect, useState, useCallback } from 'react'

/* ---------------------------------------------------------------------------
   App-wide, UI-only settings store (persisted to localStorage).
   Drives the dashboard name and the live brand colour used across all panels.
--------------------------------------------------------------------------- */

export const DEFAULT_SETTINGS = {
  appName: 'Saba Live',
  tagline: 'Admin Panel',
  brandColor: '#7c3aed',
  sidebarStyle: 'light', // 'light' | 'dark' — Super Admin forces dark regardless
  denseTables: false,
}

export const BRAND_PRESETS = [
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Slate', value: '#475569' },
]

const KEY = 'sabalive.settings'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

/* --- colour helpers --- */
const clamp = (n) => Math.max(0, Math.min(255, n))
function parseHex(hex) {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)]
}
const toHex = (rgb) => '#' + rgb.map((c) => clamp(Math.round(c)).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => a.map((c, i) => c + (b[i] - c) * t)
export function shade(hex, amt) {
  // amt < 0 -> darker, amt > 0 -> lighter
  const rgb = parseHex(hex)
  return toHex(amt < 0 ? mix(rgb, [0, 0, 0], -amt) : mix(rgb, [255, 255, 255], amt))
}

export function applyBrand(hex) {
  const root = document.documentElement.style
  root.setProperty('--primary', hex)
  root.setProperty('--primary-hover', shade(hex, -0.15))
  root.setProperty('--primary-soft', shade(hex, 0.9))
  root.setProperty('--violet-50', shade(hex, 0.92))
  root.setProperty('--violet-100', shade(hex, 0.82))
  root.setProperty('--violet-200', shade(hex, 0.7))
  root.setProperty('--violet-400', shade(hex, 0.35))
  root.setProperty('--violet-600', hex)
  root.setProperty('--violet-700', shade(hex, -0.18))
  root.setProperty('--primary-grad', `linear-gradient(135deg, ${shade(hex, 0.12)} 0%, ${hex} 100%)`)
}

const Ctx = createContext(null)
export const useSettings = () => useContext(Ctx)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load)

  useEffect(() => {
    applyBrand(settings.brandColor)
    document.title = `${settings.appName} — Admin`
    document.documentElement.setAttribute('data-sidebar', settings.sidebarStyle)
    document.documentElement.classList.toggle('dense', !!settings.denseTables)
  }, [settings.brandColor, settings.appName, settings.sidebarStyle, settings.denseTables])

  const update = useCallback((patch) => {
    setSettings((s) => {
      const next = { ...s, ...patch }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
    setSettings({ ...DEFAULT_SETTINGS })
  }, [])

  return <Ctx.Provider value={{ settings, update, reset }}>{children}</Ctx.Provider>
}
