/* Master / Super Admin -> Economy -> Diamond reset: the database calls (sabalive migration 20261026120000). The rules are in diamondResetRules.js. */
import { supabase } from './supabase.js'
import { isMissingFunction } from './dbErrors.js'
import { AUTO_NOT_INSTALLED_MESSAGE, NOT_INSTALLED_MESSAGE, normalizeAutoSettings, normalizePreview, monthLabel } from './diamondResetRules.js'

async function call(fn, args) {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw isMissingFunction(error) ? new Error(NOT_INSTALLED_MESSAGE) : error
  return data
}

export const previewDiamondReset = async (period) => normalizePreview(await call('admin_diamond_reset_preview', { p_period: period }))

/* source: 'gift' | 'reward' | 'both'. Returns [{ source, run_id, wallets, diamonds }]. */
export const resetDiamonds = (period, source, confirm) => call('admin_reset_diamonds', { p_period: period, p_source: source, p_confirm: confirm })

export const undoDiamondReset = (runId, confirm) => call('admin_undo_diamond_reset', { p_run_id: runId, p_confirm: confirm })

/* The automatic reset's settings (one row). While the table is missing the page says the database update is needed. */
export async function getAutoSettings() {
  const { data, error } = await supabase.from('diamond_reset_settings')
    .select('enabled, reset_gift, reset_reward, run_day, last_auto_at, last_auto_note').eq('id', true).maybeSingle()
  if (error) throw (/diamond_reset_settings|schema cache|does not exist/i.test(error.message || '') ? new Error(AUTO_NOT_INSTALLED_MESSAGE) : error)
  return normalizeAutoSettings(data)
}

/* s: { enabled, gift, reward, day } (already checked by checkAutoSettings; the database checks it again). */
export async function saveAutoSettings(s) {
  const { data, error } = await supabase.rpc('admin_set_diamond_reset_auto', { p_enabled: s.enabled, p_gift: s.gift, p_reward: s.reward, p_day: s.day })
  if (error) throw (isMissingFunction(error) ? new Error(AUTO_NOT_INSTALLED_MESSAGE) : error)
  return normalizeAutoSettings(data)
}

/* The run log, newest first, with the name of who pressed the button ("Automatic" for a run of the daily job). */
export async function listDiamondResets(limit = 100) {
  const cols = 'id, period, source, run_by, run_at, wallets, diamonds, undone_at, undone_by'
  let res = await supabase.from('diamond_reset_runs').select(`${cols}, auto`).order('run_at', { ascending: false }).limit(limit)
  // before the automatic-reset update the 'auto' column does not exist: read without it
  if (res.error && /diamond_reset_runs\.auto\b|column "?auto"?/i.test(res.error.message || '')) {
    res = await supabase.from('diamond_reset_runs').select(cols).order('run_at', { ascending: false }).limit(limit)
  }
  const { data, error } = res
  if (error) throw (/diamond_reset_runs|schema cache|does not exist/i.test(error.message || '') ? new Error(NOT_INSTALLED_MESSAGE) : error)
  const ids = [...new Set((data || []).flatMap((r) => [r.run_by, r.undone_by]).filter(Boolean))]
  let names = new Map()
  if (ids.length) {
    const { data: ps, error: e2 } = await supabase.from('profiles').select('id, name, display_id').in('id', ids)
    if (e2) throw e2
    names = new Map((ps || []).map((p) => [p.id, p]))
  }
  const who = (id) => (id ? (names.get(id)?.name || '—') : '')
  return (data || []).map((r) => ({
    id: r.id,
    period: r.period,
    month: monthLabel(r.period),
    source: r.source,
    what: r.source === 'gift' ? 'Gifting diamonds' : 'Reward diamonds',
    by: r.auto === true ? 'Automatic' : who(r.run_by),
    auto: r.auto === true,
    at: r.run_at,
    wallets: Number(r.wallets),
    diamonds: Number(r.diamonds),
    undone: !!r.undone_at,
    undoneAt: r.undone_at,
    undoneBy: who(r.undone_by),
    status: r.undone_at ? 'Undone' : 'Done',
  }))
}
