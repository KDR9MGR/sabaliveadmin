import { supabase } from './supabase.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }

/* Support chat (app: Settings → Support). One running conversation per user; Master
   and Super Admin read and reply here. Tables: support_threads / support_messages
   (sabalive migration 20261004120000). Users only ever see "Support", never which
   admin replied. */
export async function listThreads() {
  const rows = unwrap(await supabase.from('support_threads')
    .select('user_id, status, assigned_to, last_message_at, last_message, staff_unread, user:user_id(name, username, display_id, avatar_url), assignee:assigned_to(name)')
    .order('last_message_at', { ascending: false }).limit(300))
  return rows.map((r) => ({
    id: r.user_id,
    name: r.user?.name || '—',
    username: r.user?.username || '',
    displayId: r.user?.display_id ?? '',
    avatar: r.user?.avatar_url || '',
    status: r.status,
    assignedTo: r.assigned_to,
    assignee: r.assignee?.name || '',
    last: r.last_message,
    lastAt: r.last_message_at,
    unread: r.staff_unread || 0,
  }))
}

export async function listMessages(userId) {
  const rows = unwrap(await supabase.from('support_messages')
    .select('id, body, from_staff, created_at, sender:sender_id(name)')
    .eq('thread_id', userId).order('id').limit(500))
  return rows.map((m) => ({ id: m.id, body: m.body, fromStaff: m.from_staff, at: m.created_at, by: m.from_staff ? (m.sender?.name || 'Support') : '' }))
}

const rpc = async (fn, args) => { const { error } = await supabase.rpc(fn, args); if (error) throw error }
export const sendReply = (userId, body) => rpc('support_reply', { p_user: userId, p_body: body })
export const markThreadRead = (userId) => rpc('support_staff_mark_read', { p_user: userId })
export const setThreadStatus = (userId, status) => rpc('support_set_thread', { p_user: userId, p_status: status })
export const assignThread = (userId, assigneeId) =>
  rpc('support_set_thread', { p_user: userId, p_status: null, p_assignee: assigneeId, p_assign: true })

/* Calls onChange whenever any conversation or message changes. Returns unsubscribe. */
export function watchSupport(onChange) {
  const ch = supabase.channel(`support-inbox-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'support_threads' }, onChange)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, onChange)
    .subscribe()
  return () => { supabase.removeChannel(ch) }
}
