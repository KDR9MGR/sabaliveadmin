import { useEffect, useRef, useState } from 'react'

/* Plays an .svga animation in the browser (svgaplayerweb). The library is
   loaded on first use, so panel pages that never show an SVGA don't pay for it.
   `fallback` is shown while it loads and if the file can't be played. `autoWidth` makes the box `size` tall and as wide as the animation's own proportions
   (a 4:1 banner is 4 x size wide, at most 8x), instead of a square, once the file is read. */
export default function SvgaPlayer({ url, size = 96, loop = true, fallback = null, style, autoWidth = false }) {
  const box = useRef(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [width, setWidth] = useState(size)

  useEffect(() => {
    let player = null
    let cancelled = false
    setReady(false)
    setFailed(false)
    setWidth(size)
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
          const vs = videoItem?.videoSize
          if (autoWidth && vs?.width > 0 && vs?.height > 0) setWidth(Math.min(size * 8, Math.max(size * 0.3, (size * vs.width) / vs.height)))
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
  }, [url, loop, size, autoWidth])

  if (failed) return fallback
  return (
    <div style={{ position: 'relative', width: autoWidth ? width : size, height: size, ...style }}>
      <div ref={box} style={{ width: '100%', height: '100%' }} />
      {!ready && fallback && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{fallback}</div>}
    </div>
  )
}
