import { supabase } from './supabase.js'

/* Invisible live viewing from the panel (Super Admin / Master only).
   The watcher joins the Agora channel as audience, which Agora never announces,
   and never writes a live_stream_viewers row — so it isn't in "watching now",
   isn't counted, and no "joined" line or entry effect plays. */

const unwrap = ({ data, error }) => { if (error) throw error; return data }

/* A subscriber-only Agora token. `ghost: true` is what the agora-token function
   requires before it skips the per-room checks; it refuses anyone who isn't a
   Super Admin / Master (or an active ghost account). */
export async function fetchGhostToken(channelName) {
  const { data, error } = await supabase.functions.invoke('agora-token', {
    body: { channelName, role: 'subscriber', ghost: true },
  })
  if (error) {
    let msg = error.message
    try { msg = (await error.context?.json())?.error || msg } catch { /* keep msg */ }
    throw new Error(msg)
  }
  return data // { token, appId, channelName, uid, expiresIn }
}

export const logPanelWatch = (streamId) =>
  supabase.rpc('panel_log_ghost_watch', { p_stream_id: streamId }).then(({ error }) => { if (error) throw error })

export async function getStreamState(id) {
  const row = unwrap(await supabase.from('live_streams')
    .select('status, viewer_count, like_count, gift_coin_total').eq('id', id).maybeSingle())
  return row
}

export async function listStreamViewers(id) {
  const rows = unwrap(await supabase.from('live_stream_viewers')
    .select('viewer_id, joined_at, viewer:viewer_id(name, username)')
    .eq('live_stream_id', id).is('left_at', null).order('joined_at', { ascending: false }).limit(200))
  return rows.map((r) => ({ id: r.viewer_id, name: r.viewer?.name || '—', username: r.viewer?.username }))
}

export async function listRecentChat(id, limit = 60) {
  const rows = unwrap(await supabase.from('live_chat_messages')
    .select('id, body, kind, created_at, sender:sender_id(name, username)')
    .eq('live_stream_id', id).order('created_at', { ascending: false }).limit(limit))
  return rows.reverse().map((m) => ({ id: m.id, kind: m.kind, body: m.body, name: m.sender?.name || '—' }))
}

/* Live chat lines as they arrive. Returns an unsubscribe function. */
export function watchChat(id, onLine) {
  const names = new Map()
  const channel = supabase.channel(`ghost-chat-${id}-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `live_stream_id=eq.${id}` },
      async ({ new: m }) => {
        let name = names.get(m.sender_id)
        if (!name) {
          const { data } = await supabase.from('profiles').select('name').eq('id', m.sender_id).maybeSingle()
          name = data?.name || '—'
          names.set(m.sender_id, name)
        }
        onLine({ id: m.id, kind: m.kind, body: m.body, name })
      })
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}
