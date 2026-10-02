import { mediaKind } from '../lib/storage.js'
import SvgaPlayer from './SvgaPlayer.jsx'

/* Renders an uploaded gift/badge/frame asset (image or video) when present,
   falling back to the plain-text emoji otherwise — used in both the gallery
   preview and the table icon column, so upload and emoji-only rows look
   consistent side by side. */
export default function MediaPreview({ url, emoji, size = 20 }) {
  if (!url) return <span style={{ fontSize: size }}>{emoji}</span>
  const kind = mediaKind(url)
  const box = { width: size * 2, height: size * 2, objectFit: 'cover', borderRadius: 6 }
  if (kind === 'video') return <video src={url} autoPlay loop muted playsInline style={box} />
  if (kind === 'image') return <img src={url} alt="" style={box} />
  if (kind === 'svga') {
    return <SvgaPlayer url={url} size={size * 2} fallback={<span style={{ fontSize: size }}>{emoji || '📄'}</span>} />
  }
  return <span style={{ fontSize: size }}>{emoji || '📄'}</span>
}
