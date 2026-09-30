import { supabase } from './supabase.js'

/* Shared upload helper for admin-managed visual assets (gift/badge/frame
   icons, banners): SVGA, WebP, MP4 or PNG. SVGA has no registered MIME
   type, so it's sent as application/octet-stream. */
const CONTENT_TYPES = {
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  svga: 'application/octet-stream',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}
export const UPLOAD_ACCEPT = '.svga,.webp,.mp4,.png,image/png,image/webp,video/mp4'

export async function uploadMedia(bucket, folder, file) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const contentType = CONTENT_TYPES[ext] || file.type || 'application/octet-stream'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

/* What to render a given uploaded URL as — browsers can play mp4 and show
   png/webp natively; SVGA has no native renderer here, so callers fall back
   to showing the emoji/a generic icon instead. */
export function mediaKind(url) {
  const ext = (url || '').split('?')[0].split('.').pop()?.toLowerCase()
  if (ext === 'mp4') return 'video'
  if (ext === 'png' || ext === 'webp' || ext === 'jpg' || ext === 'jpeg') return 'image'
  return 'other'
}
