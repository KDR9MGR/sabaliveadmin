import { supabase } from './supabase.js'
import { fmtDate } from './admin.js'

/* Ghost IDs — accounts that sign in to the app and watch lives invisibly, for
   monitoring. Super Admin only. Creating, disabling, resetting and deleting need
   the service role, so they go through the `ghost-admin` Edge Function; editing
   the label / notes is a plain RPC. Everything is enforced server-side. */

const unwrap = ({ data, error }) => { if (error) throw error; return data }

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('ghost-admin', { body })
  if (error) {
    let msg = error.message
    try { msg = (await error.context?.json())?.error || msg } catch { /* keep msg */ }
    throw new Error(msg)
  }
  return data
}

const fmtDateTime = (iso) => (iso
  ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—')

export async function listGhosts() {
  const rows = unwrap(await supabase.from('ghost_accounts')
    .select('profile_id, label, notes, active, login_email, created_at, last_watched_at, creator:created_by(name)')
    .order('created_at', { ascending: false }))
  return rows.map((g) => ({
    id: g.profile_id,
    label: g.label,
    notes: g.notes || '',
    email: g.login_email || '—',
    active: g.active,
    status: g.active ? 'Active' : 'Disabled',
    createdBy: g.creator?.name || '—',
    created: fmtDate(g.created_at),
    lastWatched: fmtDateTime(g.last_watched_at),
  }))
}

// -> { user_id, email, temp_password | null }
export const createGhost = ({ label, notes, email, password }) =>
  invoke({ action: 'create', label, notes, email: email || undefined, password: password || undefined })

// -> { user_id, temp_password | null }
export const resetGhostPassword = (userId, password) =>
  invoke({ action: 'set_password', user_id: userId, password: password || undefined })

export const setGhostActive = (userId, active) => invoke({ action: 'set_active', user_id: userId, active })
export const deleteGhost = (userId) => invoke({ action: 'delete', user_id: userId })

export async function updateGhost(userId, { label, notes }) {
  const { error } = await supabase.rpc('update_ghost_account', {
    p_user: userId, p_label: label, p_notes: notes ?? '', p_active: null,
  })
  if (error) throw error
}

/* Who watched what: a ghost in the app, or a Super Admin / Master from the panel. */
export async function listWatchLog(limit = 300) {
  const rows = unwrap(await supabase.from('ghost_watch_log')
    .select('id, via, started_at, watcher:watcher_id(name, username), host:host_id(name, username), stream:live_stream_id(title)')
    .order('started_at', { ascending: false }).limit(limit))
  return rows.map((r) => ({
    id: r.id,
    watcher: r.watcher?.name || '—',
    via: r.via === 'panel' ? 'Panel' : 'Ghost ID',
    host: r.host?.name || '—',
    stream: r.stream?.title || '—',
    when: fmtDateTime(r.started_at),
  }))
}
