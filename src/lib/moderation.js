import { supabase } from './supabase.js'
import { shortId, fmtDate } from './admin.js'
import { relativeTime } from './format.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }

/* Chat the app's personal-info filter caught — see
   sabalive/supabase/migrations/20261002120000_personal_info_filter.sql.
   A trigger masks phone numbers / e-mails / UPI ids / messenger links before the
   message is stored (so no other user sees them) and writes the ORIGINAL text
   here with who sent it and, for live chat, whose room it was. Only platform
   admins can read this table. */

export const FLAG_KINDS = { phone: 'Phone number', email: 'E-mail', upi: 'UPI id', link: 'Messenger / social link' }
export const FLAG_SOURCES = { live_chat: 'Live chat', direct_message: 'Direct message' }
export const FLAG_STATUS = { new: 'New', reviewed: 'Reviewed', actioned: 'Actioned' }

const PERSON = 'name, username, display_id, avatar_url'

const person = (p) => ({
  name: p?.name || '—',
  username: p?.username,
  displayId: p?.display_id,
  avatar: p?.avatar_url || null,
})

export async function listPersonalInfoFlags() {
  const rows = unwrap(await supabase.from('personal_info_flags')
    .select(`id, source, source_row_id, sender_id, host_id, recipient_id, live_stream_id, original_text, masked_text, kinds, status, created_at,
      sender:profiles!sender_id(${PERSON}),
      host:profiles!host_id(${PERSON}),
      recipient:profiles!recipient_id(${PERSON})`)
    .order('created_at', { ascending: false })
    .limit(500))
  return rows.map((r) => {
    const sender = person(r.sender)
    const host = r.host_id ? person(r.host) : null
    const recipient = r.recipient_id ? person(r.recipient) : null
    return {
      id: r.id,
      idShort: shortId(String(r.id)),
      source: FLAG_SOURCES[r.source] || r.source,
      sourceKey: r.source,
      sender: sender.name,
      senderUsername: sender.username,
      senderDisplayId: sender.displayId,
      senderId: r.sender_id,
      avatar: sender.avatar,
      host: host?.name || null,
      hostUsername: host?.username,
      hostDisplayId: host?.displayId,
      hostId: r.host_id,
      recipient: recipient?.name || null,
      recipientUsername: recipient?.username,
      recipientId: r.recipient_id,
      // the room (live chat) or the person on the other end (1:1 DM)
      where: r.source === 'live_chat' ? (host?.name || 'Live room') : (recipient?.name || 'Group chat'),
      kinds: r.kinds || [],
      kindLabels: (r.kinds || []).map((k) => FLAG_KINDS[k] || k),
      original: r.original_text,
      masked: r.masked_text,
      status: r.status,
      statusLabel: FLAG_STATUS[r.status] || r.status,
      date: fmtDate(r.created_at),
      when: relativeTime(r.created_at),
      at: r.created_at,
    }
  })
}

export async function setFlagStatus(id, status) {
  if (!FLAG_STATUS[status]) throw new Error('Unknown status')
  const me = (await supabase.auth.getSession()).data.session?.user?.id
  const patch = status === 'new'
    ? { status, reviewed_by: null, reviewed_at: null }
    : { status, reviewed_by: me, reviewed_at: new Date().toISOString() }
  return unwrap(await supabase.from('personal_info_flags').update(patch).eq('id', id).select('id').single())
}
