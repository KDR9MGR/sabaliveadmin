import { useEffect, useRef, useState } from 'react'

/* Plays an .svga animation in the browser (svgaplayerweb). The library is
   loaded on first use, so panel pages that never show an SVGA don't pay for it.
   `fallback` is shown while it loads and if the file can't be played. */
export default function SvgaPlayer({ url, size = 96, loop = true, fallback = null, style }) {
  const box = useRef(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let player = null
    let cancelled = false
    setReady(false)
    setFailed(false)
    import('svgaplayerweb').then((mod) => {
      const SVGA = mod.default || mod
      if (cancelled || !box.current) return
      player = new SVGA.Player(box.current)
      player.loops = loop ? 0 : 1
      player.clearsAfterStop = false
      player.setContentMode('AspectFit')
      new SVGA.Parser().load(
        url,
        (videoItem) => {
          if (cancelled) return
          player.setVideoItem(videoItem)
          player.startAnimation()
          setReady(true)
        },
        () => { if (!cancelled) setFailed(true) },
      )
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => {
      cancelled = true
      try { player?.stopAnimation(); player?.clear() } catch { /* already gone */ }
    }
  }, [url, loop])

  if (failed) return fallback
  return (
    <div style={{ position: 'relative', width: size, height: size, ...style }}>
      <div ref={box} style={{ width: '100%', height: '100%' }} />
      {!ready && fallback && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{fallback}</div>}
    </div>
  )
}
