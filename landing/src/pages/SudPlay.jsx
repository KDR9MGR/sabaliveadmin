import { useEffect, useMemo, useRef, useState } from 'react'
import { readLaunchParams, EXIT_URL, LOAD_TIMEOUT_MS, LOAD_TIMEOUT_MESSAGE } from '../lib/sudParams.js'
import { startSudGame } from '../lib/sudGame.js'

/* https://sabalive.in/sud/play?... — the page the app opens in its game panel to play a SUD game. Full screen, no site header or footer. The address is made by
   our server (Edge Function `sud`, route `launch`); see sudParams.js. The SUD web SDK draws the game into the container. */
export default function SudPlay() {
  const rootRef = useRef(null)
  const params = useMemo(() => readLaunchParams(window.location.search), [])
  const [phase, setPhase] = useState(params.ok ? 'loading' : 'error')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(params.ok ? '' : params.error)

  // a game page must not zoom or scroll
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]')
    const before = meta?.getAttribute('content')
    meta?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    document.title = 'Game'
    return () => {
      if (before) meta?.setAttribute('content', before)
      html.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    if (!params.ok) return undefined
    let game = null
    let cancelled = false
    startSudGame({
      root: rootRef.current,
      params,
      onProgress: (p) => !cancelled && setProgress(Math.max(0, Math.min(100, Math.round(p)))),
      onStarted: () => !cancelled && setPhase('playing'),
      onError: (message) => { if (!cancelled) { setError(message); setPhase('error') } },
      onExit: (url) => { window.location.href = url },
    }).then((g) => { game = g; if (cancelled) g.destroy() })
    return () => { cancelled = true; game?.destroy() }
  }, [params])

  // a game that never starts (no connection, SUD refusing the app) must not spin forever; a slow line may need about a minute
  useEffect(() => {
    if (phase !== 'loading') return undefined
    const t = setTimeout(() => { setError(LOAD_TIMEOUT_MESSAGE); setPhase('error') }, LOAD_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [phase])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif', overflow: 'hidden', touchAction: 'manipulation' }}>
      <div ref={rootRef} id="sud-root" style={{ position: 'absolute', inset: 0 }} />
      {phase === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 160, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.2)', overflow: 'hidden', margin: '0 auto' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#a78bfa', transition: 'width .2s' }} />
            </div>
            <p style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>Loading the game…</p>
          </div>
        </div>
      )}
      {phase === 'error' && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: 15, lineHeight: 1.5, maxWidth: 320 }}>{error}</p>
            <a href={EXIT_URL} style={{ display: 'inline-block', marginTop: 16, padding: '10px 22px', borderRadius: 999, background: '#7c3aed', color: '#fff', textDecoration: 'none', fontSize: 14 }}>Close</a>
          </div>
        </div>
      )}
    </div>
  )
}
