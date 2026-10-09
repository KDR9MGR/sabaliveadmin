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
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
}
export const UPLOAD_ACCEPT = '.svga,.mp4,.gif,.webp,.png,.jpg,.jpeg,image/png,image/webp,image/gif,image/jpeg,video/mp4'
export const UPLOAD_HINT = 'SVGA, MP4, GIF, WebP or PNG'
/* A sound that plays with a gift / entry effect on every phone in the room. */
export const AUDIO_ACCEPT = '.mp3,.m4a,.aac,.wav,.ogg,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/ogg'
export const AUDIO_HINT = 'MP3, M4A, AAC, WAV or OGG, up to 15 MB'
const MAX_BYTES = 15 * 1024 * 1024 // the gift-assets bucket's limit

export async function uploadMedia(bucket, folder, file) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  if (bucket === 'gift-assets' && file.size > MAX_BYTES) {
    throw new Error(`That file is ${(file.size / 1048576).toFixed(1)} MB; the limit is 15 MB`)
  }
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
  if (['mp3', 'm4a', 'aac', 'wav', 'ogg'].includes(ext)) return 'audio'
  if (['png', 'webp', 'gif', 'jpg', 'jpeg'].includes(ext)) return 'image'
  return 'other'
}
