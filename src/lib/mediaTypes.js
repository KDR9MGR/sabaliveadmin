/* What an uploaded asset is, from its address, and the rules for an SVG upload. Pure (no imports), so it is tested in mediaTypes.test.js; storage.js re-exports it. */

/* An SVG is sent as application/octet-stream, exactly like SVGA: the storage buckets only accept a fixed list of types, and a file served as a generic binary is never run by a
   browser that opens its address (an SVG served as image/svg+xml could carry script). The panel previews it by reading the file and drawing it as an image; the app reads the file. */
export const SVG_UPLOAD_CONTENT_TYPE = 'application/octet-stream'

/* What to render a given uploaded URL as: browsers play mp4 and show png / webp / gif natively; SVGA needs the SvgaPlayer component; SVG needs SvgPreview. */
export function mediaKind(url) {
  const ext = (url || '').split('?')[0].split('.').pop()?.toLowerCase()
  if (ext === 'svga') return 'svga'
  if (ext === 'svg') return 'svg'
  if (ext === 'mp4' || ext === 'webm') return 'video'
  if (['mp3', 'm4a', 'aac', 'wav', 'ogg'].includes(ext)) return 'audio'
  if (['png', 'webp', 'gif', 'jpg', 'jpeg'].includes(ext)) return 'image'
  return 'other'
}

export const isSvg = (url) => mediaKind(url) === 'svg'

/* The start of a file's text -> is it an SVG drawing? (A renamed picture or an HTML page is refused before it is uploaded.) */
export function looksLikeSvg(startOfFile) {
  const text = String(startOfFile || '').replace(/^﻿/, '').slice(0, 8192)
  return /<svg[\s>]/i.test(text)
}

/* Anything in an SVG that would run or reach out. The app ignores all of this and the panel draws the file as an image (where none of it runs), but a file that carries it
   is refused anyway: there is no reason for a gift or a badge to contain a script. */
export function svgProblem(text) {
  const t = String(text || '')
  if (/<\s*script[\s>]/i.test(t)) return 'It contains a script'
  if (/\son[a-z]+\s*=/i.test(t)) return 'It contains an event handler (onclick, onload ...)'
  if (/<\s*foreignObject[\s>]/i.test(t)) return 'It contains embedded HTML (foreignObject)'
  if (/javascript\s*:/i.test(t)) return 'It contains a javascript: link'
  return ''
}
