import { supabase } from './supabase.js'

/* Shared upload helper for admin-managed visual assets (gift/badge/frame/store
   icons, banners, emoji GIFs): SVGA, MP4, GIF, WebP, PNG or JPG. SVGA has no
   registered MIME type, so it's sent as application/octet-stream. */
const CONTENT_TYPES = {
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  svga: 'application/octet-stream',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}
export const UPLOAD_ACCEPT = '.svga,.mp4,.gif,.webp,.png,.jpg,.jpeg,image/png,image/webp,image/gif,image/jpeg,video/mp4'
export const UPLOAD_HINT = 'SVGA, MP4, GIF, WebP or PNG'

export async function uploadMedia(bucket, folder, file) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const contentType = CONTENT_TYPES[ext] || file.type || 'application/octet-stream'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

/* What to render a given uploaded URL as — browsers play mp4 and show
   png/webp/gif natively; SVGA needs the SvgaPlayer component. */
export function mediaKind(url) {
  const ext = (url || '').split('?')[0].split('.').pop()?.toLowerCase()
  if (ext === 'svga') return 'svga'
  if (ext === 'mp4' || ext === 'webm') return 'video'
  if (['png', 'webp', 'gif', 'jpg', 'jpeg'].includes(ext)) return 'image'
  return 'other'
}
