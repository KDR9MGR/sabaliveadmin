import { supabase } from './supabase.js'

/* System KPIs (Supabase production + staging, Agora usage) and project restart, served by the `system-ops` Edge
   Function — the Supabase access token and Agora keys live there as secrets, never in the panel. The function decides
   who may see / restart (a Super Admin, or an account with System management / Infrastructure on), so the panel only
   shows what it returns. */
async function call(body) {
  const { data, error } = await supabase.functions.invoke('system-ops', { body })
  if (error) {
    let msg = error.message
    try { msg = (await error.context?.json())?.error || msg } catch { /* keep msg */ }
    throw new Error(msg)
  }
  return data
}

export const getSystemKpis = () => call({ action: 'kpis' })

export const RESTART_PHRASE = (target) => `RESTART ${String(target).toUpperCase()}`
export const restartProject = (target) => call({ action: 'restart', target, confirm: RESTART_PHRASE(target) })

/* ---- formatting helpers ---- */
export function fmtBytes(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = Number(n)
  let i = 0
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${u[i]}`
}
export function fmtDuration(sec) {
  if (sec == null || !Number.isFinite(Number(sec))) return '—'
  const s = Number(sec)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`
}
export const fmtNum = (n) => (n == null || !Number.isFinite(Number(n)) ? '—' : Number(n).toLocaleString('en-IN'))
export const fmtPct = (n) => (n == null || !Number.isFinite(Number(n)) ? '—' : `${n}%`)

/* "ok" | "warn" | "bad" for a percentage of a limit — the same 60% / 85% lines the deploy healthcheck uses. */
export const loadTone = (pct) => (pct == null ? 'muted' : pct >= 85 ? 'danger' : pct >= 60 ? 'warning' : 'success')
