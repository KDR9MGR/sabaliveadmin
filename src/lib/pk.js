import { supabase } from './supabase.js'
import { relativeTime } from './format.js'
import { checkPkRules, minutesLabel } from './pkStats.js'
import { checkPkTheme, readPkTheme } from './pkTheme.js'
import { updateAppConfig } from './appConfig.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }

/* PK battles (sabalive migrations 20261017100000 + 20261017110000, the PK battle layer). The ON/OFF switches are NOT here: they are
   app_config.feature_flags pk_battles / pk_layer / pk_video (Application Config -> Release controls, Super Admin). */

export async function getPkSwitches() {
  const row = unwrap(await supabase.from('app_config').select('feature_flags').eq('id', true).maybeSingle())
  const f = row?.feature_flags || {}
  const on = (k, def) => (typeof f[k] === 'boolean' ? f[k] : def)
  return { battles: on('pk_battles', false), layer: on('pk_layer', true), video: on('pk_video', false) }
}

/* The rules row, as the form shows it (minutes where people think in minutes). null while the PK migrations are not on this project. */
export async function getPkRules() {
  const { data, error } = await supabase.from('pk_config')
    .select('invite_durations, random_duration, forfeit_grace_seconds, invites_per_minute, random_queue_seconds, updated_at').eq('id', true).maybeSingle()
  if (error) {
    if (/pk_config|relation|does not exist|schema cache/i.test(error.message || '')) return null
    throw error
  }
  if (!data) return null
  return {
    invite_minutes: (data.invite_durations || []).map((s) => s / 60).join(', '),
    random_minutes: data.random_duration / 60,
    forfeit_grace_seconds: data.forfeit_grace_seconds,
    invites_per_minute: data.invites_per_minute,
    random_queue_seconds: data.random_queue_seconds,
    updatedAt: data.updated_at,
  }
}

/* Saves the rules through the server function admin_set_pk_config (Super Admin). That function is a BACKEND piece that is added with
   the PK database work; until it exists the call fails and the page says so instead of pretending it saved. */
export async function savePkRules(v) {
  const checked = checkPkRules(v)
  if (checked.error) throw new Error(checked.error)
  const r = checked.rules
  const { error } = await supabase.rpc('admin_set_pk_config', {
    p_invite_durations: r.invite_durations,
    p_random_duration: r.random_duration,
    p_forfeit_grace_seconds: r.forfeit_grace_seconds,
    p_invites_per_minute: r.invites_per_minute,
    p_random_queue_seconds: r.random_queue_seconds,
  })
  if (error) {
    if (/admin_set_pk_config|could not find the function|schema cache/i.test(error.message || '')) {
      throw new Error('The server function that saves these rules is not installed yet (it comes with the PK database work).')
    }
    throw error
  }
}

/* The PK look (colours, animations, intro, lose badge): app_config.pk_theme, sabalive migration 20261020100000. { available: false } while the
   column is not on this project, so the page can say so instead of failing. */
export async function getPkTheme() {
  const { data, error } = await supabase.from('app_config').select('pk_theme').eq('id', true).maybeSingle()
  if (error) {
    if (/pk_theme|column|schema cache/i.test(error.message || '')) return { available: false, theme: readPkTheme(null) }
    throw error
  }
  return { available: true, theme: readPkTheme(data?.pk_theme) }
}

/* Saves the look. The built-in look is saved as nothing (it clears the column), so the apps use their own colours. Master / Super Admin
   (the app_config update policy); anyone else gets a sentence, not a stack trace. */
export async function savePkTheme(form) {
  const checked = checkPkTheme(form)
  if (checked.error) throw new Error(checked.error)
  try {
    await updateAppConfig({ pk_theme: checked.theme })
  } catch (e) {
    const m = e?.message || ''
    if (/pk_theme|column|schema cache/i.test(m)) throw new Error('The PK look is not installed on this project yet (it needs the database update 20261020100000).')
    if (e?.code === 'PGRST116' || /no rows|multiple \(or no\) rows/i.test(m)) throw new Error('Only a Master or Super Admin can change the PK look.')
    if (/check constraint/i.test(m)) throw new Error('The server refused that value. Check the colours.')
    throw e
  }
}

const hostName = (p) => p?.name || '—'

const mapBattle = (r) => ({
  id: r.id,
  invitedAt: r.invited_at,
  startedAt: r.started_at,
  when: relativeTime(r.invited_at),
  status: r.status,
  kind: r.kind || 'pk',
  source: r.source || 'old PK screen',
  hostA: hostName(r.a),
  hostB: hostName(r.b),
  idA: r.a?.display_id,
  idB: r.b?.display_id,
  scoreA: Number(r.score_a || 0),
  scoreB: Number(r.score_b || 0),
  winner: r.winner,
  endReason: r.end_reason || null,
  length: minutesLabel(r.duration_seconds),
})

const COLUMNS_NEW = 'id, status, kind, source, duration_seconds, end_reason, score_a, score_b, winner, invited_at, started_at, ended_at'
const COLUMNS_OLD = 'id, status, score_a, score_b, winner, invited_at, started_at, ended_at'
const HOSTS = 'a:profiles!pk_battles_host_a_id_fkey(name, display_id), b:profiles!pk_battles_host_b_id_fkey(name, display_id)'

/* Battles invited in the last [days] days, newest first (at most [limit]). Works before and after the PK migrations. */
export async function listBattles(days = 14, limit = 1000) {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const run = (cols) => supabase.from('pk_battles').select(`${cols}, ${HOSTS}`).gte('invited_at', since).order('invited_at', { ascending: false }).limit(limit)
  let res = await run(COLUMNS_NEW)
  if (res.error && /kind|source|end_reason|duration_seconds|column/i.test(res.error.message || '')) res = await run(COLUMNS_OLD)
  return unwrap(res).map(mapBattle)
}
