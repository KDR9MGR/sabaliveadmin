import { supabase } from './supabase.js'
import { shortId, fmtDate } from './admin.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const titleCase = (s) => (s ? String(s).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s)
const nz = (v) => (v === '' || v == null ? null : v)

export const BANNER_PLACEMENTS = ['home_top', 'live_room', 'wallet', 'explore']
export const BANNER_STATUSES = ['active', 'scheduled', 'expired']
export const LEGAL_STATUSES = ['draft', 'published']
export const ANNOUNCE_AUDIENCES = ['all', 'hosts', 'agencies', 'sub_admins']
export const ANNOUNCE_CHANNELS = ['in_app', 'push', 'email']

/* ---------------------------------------------------------------- banners */
export async function listBanners() {
  const rows = unwrap(await supabase.from('banners')
    .select('id, title, image_url, placement, starts_at, ends_at, status')
    .order('starts_at', { ascending: false, nullsFirst: false }))
  return rows.map((b) => ({
    id: b.id, idShort: shortId(b.id),
    title: b.title, imageUrl: b.image_url,
    placement: titleCase(b.placement),
    starts: b.starts_at ? fmtDate(b.starts_at) : '—',
    ends: b.ends_at ? fmtDate(b.ends_at) : '—',
    status: titleCase(b.status),
  }))
}
export async function createBanner(v) {
  return unwrap(await supabase.from('banners').insert({
    title: v.title,
    image_url: nz(v.image_url),
    placement: (v.placement || 'home_top').toLowerCase(),
    starts_at: nz(v.starts_at),
    ends_at: nz(v.ends_at),
    status: (v.status || 'scheduled').toLowerCase(),
  }).select().single())
}
export async function updateBanner(id, v) {
  const p = {}
  if (v.title != null) p.title = v.title
  if (v.image_url !== undefined) p.image_url = nz(v.image_url)
  if (v.placement) p.placement = v.placement.toLowerCase()
  if (v.starts_at !== undefined) p.starts_at = nz(v.starts_at)
  if (v.ends_at !== undefined) p.ends_at = nz(v.ends_at)
  if (v.status) p.status = v.status.toLowerCase()
  return unwrap(await supabase.from('banners').update(p).eq('id', id).select().single())
}
export const setBannerStatus = (id, status) => updateBanner(id, { status })

/* ---------------------------------------------------------------- legal pages */
export async function listLegalPages() {
  const rows = unwrap(await supabase.from('legal_pages')
    .select('id, title, slug, body, status, updated_at')
    .order('title'))
  return rows.map((p) => ({
    id: p.id, idShort: shortId(p.id),
    title: p.title, slug: p.slug, body: p.body || '',
    chars: (p.body || '').length,
    status: titleCase(p.status),
    updated: fmtDate(p.updated_at),
  }))
}
export async function createLegalPage(v) {
  return unwrap(await supabase.from('legal_pages').insert({
    title: v.title,
    slug: v.slug,
    body: v.body || '',
    status: (v.status || 'draft').toLowerCase(),
    updated_at: new Date().toISOString(),
  }).select().single())
}
export async function updateLegalPage(id, v) {
  const p = { updated_at: new Date().toISOString() }
  if (v.title != null) p.title = v.title
  if (v.slug != null) p.slug = v.slug
  if (v.body != null) p.body = v.body
  if (v.status) p.status = v.status.toLowerCase()
  return unwrap(await supabase.from('legal_pages').update(p).eq('id', id).select().single())
}
export const setLegalStatus = (id, status) => updateLegalPage(id, { status })

/* ---------------------------------------------------------------- announcements */
export async function listAnnouncements() {
  const rows = unwrap(await supabase.from('announcements')
    .select('id, title, body, audience, channel, status, sent_at, created_at')
    .order('created_at', { ascending: false }))
  return rows.map((a) => ({
    id: a.id, idShort: shortId(a.id),
    title: a.title, body: a.body || '',
    audience: titleCase(a.audience),
    channel: titleCase(a.channel),
    status: titleCase(a.status),
    sent: a.sent_at ? fmtDate(a.sent_at) : '—',
    created: fmtDate(a.created_at),
  }))
}
export async function createAnnouncement(v) {
  return unwrap(await supabase.from('announcements').insert({
    title: v.title,
    body: v.body || '',
    audience: (v.audience || 'all').toLowerCase(),
    channel: (v.channel || 'in_app').toLowerCase(),
    status: (v.status || 'draft').toLowerCase(),
  }).select().single())
}
export async function updateAnnouncement(id, v) {
  const p = {}
  if (v.title != null) p.title = v.title
  if (v.body != null) p.body = v.body
  if (v.audience) p.audience = v.audience.toLowerCase()
  if (v.channel) p.channel = v.channel.toLowerCase()
  if (v.status) p.status = v.status.toLowerCase()
  return unwrap(await supabase.from('announcements').update(p).eq('id', id).select().single())
}
export async function markAnnouncementSent(id) {
  return unwrap(await supabase.from('announcements')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id).select().single())
}
