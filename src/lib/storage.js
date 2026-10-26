import { supabase } from './supabase.js'

import { mediaKind, looksLikeSvg, svgProblem, SVG_UPLOAD_CONTENT_TYPE } from './mediaTypes.js'

export { mediaKind, isSvg } from './mediaTypes.js'

/* Shared upload helper for admin-managed visual assets (gift/badge/frame/store
   icons, banners, emoji GIFs): SVGA, SVG, MP4, GIF, WebP, PNG or JPG. SVGA has no
   registered MIME type, so it's sent as application/octet-stream; so is SVG (see
   mediaTypes.js for why). */
const CONTENT_TYPES = {
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  svga: 'application/octet-stream',
  svg: SVG_UPLOAD_CONTENT_TYPE,
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
}
export const UPLOAD_ACCEPT = '.svga,.svg,.mp4,.gif,.webp,.png,.jpg,.jpeg,image/png,image/webp,image/gif,image/jpeg,image/svg+xml,video/mp4'
export const UPLOAD_HINT = 'SVGA, SVG, MP4, GIF, WebP or PNG'
/* A sound that plays with a gift / entry effect on every phone in the room. */
export const AUDIO_ACCEPT = '.mp3,.m4a,.aac,.wav,.ogg,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/ogg'
export const AUDIO_HINT = 'MP3, M4A, AAC, WAV or OGG, up to 15 MB'
const MAX_BYTES = 15 * 1024 * 1024 // the gift-assets bucket's limit

export async function uploadMedia(bucket, folder, file) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  if (bucket === 'gift-assets' && file.size > MAX_BYTES) {
    throw new Error(`That file is ${(file.size / 1048576).toFixed(1)} MB; the limit is 15 MB`)
  }
  if (ext === 'svg') {
    // an SVG is plain text: make sure it really is a drawing and carries nothing that runs
    const text = await file.text()
    if (!looksLikeSvg(text)) throw new Error('That file is not an SVG drawing')
    const problem = svgProblem(text)
    if (problem) throw new Error(`That SVG cannot be used: ${problem}`)
  }
  const contentType = CONTENT_TYPES[ext] || file.type || 'application/octet-stream'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
