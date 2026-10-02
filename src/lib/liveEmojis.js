import { supabase } from './supabase.js'
import { shortId } from './admin.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const num = (v) => (v === '' || v == null ? undefined : Number(v))

/* The emoji / GIF picker in the app's live chat (audio and video rooms) —
   live_emojis, see sabalive migration 20261002130000. kind 'emoji' is typed into
   chat as text; kind 'gif' is an animated picture (GIF / WebP / SVGA / MP4) sent
   as its own chat message. */
export const EMOJI_KINDS = { emoji: 'Emoji', gif: 'GIF / animated' }

const row = (r) => ({
  id: r.id,
  idShort: shortId(r.id),
  kind: r.kind,
  kindLabel: EMOJI_KINDS[r.kind] || r.kind,
  label: r.label,
  emoji: r.emoji,
  assetUrl: r.asset_url,
  sort: r.sort_order,
  status: r.status === 'active' ? 'Active' : 'Inactive',
})

export async function listLiveEmojis() {
  const rows = unwrap(await supabase.from('live_emojis')
    .select('id, kind, label, emoji, asset_url, sort_order, status')
    .order('sort_order').order('created_at'))
  return rows.map(row)
}

const check = (v) => {
  if (!String(v.label || '').trim()) throw new Error('Label is required')
  if (v.kind === 'gif' && !v.asset_url) throw new Error('Upload the GIF / animation file')
  if (v.kind === 'emoji' && !String(v.emoji || '').trim()) throw new Error('Enter the emoji character')
}

export async function createLiveEmoji(v) {
  check(v)
  return unwrap(await supabase.from('live_emojis').insert({
    kind: v.kind,
    label: v.label.trim(),
    emoji: v.kind === 'emoji' ? v.emoji.trim() : (String(v.emoji || '').trim() || null),
    asset_url: v.kind === 'gif' ? v.asset_url : null,
    sort_order: num(v.sort_order) ?? 0,
    status: (v.status || 'active').toLowerCase(),
  }).select().single())
}

export async function updateLiveEmoji(id, v) {
  check(v)
  return unwrap(await supabase.from('live_emojis').update({
    kind: v.kind,
    label: v.label.trim(),
    emoji: v.kind === 'emoji' ? v.emoji.trim() : (String(v.emoji || '').trim() || null),
    asset_url: v.kind === 'gif' ? v.asset_url : null,
    sort_order: num(v.sort_order) ?? 0,
    status: String(v.status || 'active').toLowerCase(),
  }).eq('id', id).select().single())
}

export async function setLiveEmojiStatus(id, status) {
  return unwrap(await supabase.from('live_emojis').update({ status }).eq('id', id).select().single())
}

export async function deleteLiveEmoji(id) {
  const { error } = await supabase.from('live_emojis').delete().eq('id', id)
  if (error) throw error
}
