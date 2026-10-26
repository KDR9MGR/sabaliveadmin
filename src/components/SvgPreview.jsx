import { useEffect, useState } from 'react'

/* Shows an uploaded .svg. The file is stored as a generic binary (see lib/mediaTypes.js), which a browser will not draw if it is simply used as an image address, so it is
   read here and drawn as an image from the file's own bytes: an SVG drawn as an <img> never runs a script. `fallback` shows while it loads and if it can't be read. */
export default function SvgPreview({ url, style, fallback = null, alt = '' }) {
  const [src, setSrc] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let objectUrl = ''
    setSrc('')
    setFailed(false)
    fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('not found'))))
      .then((bytes) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/svg+xml' }))
        setSrc(objectUrl)
      })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  if (failed || !src) return fallback
  return <img src={src} alt={alt} style={style} onError={() => setFailed(true)} />
}
