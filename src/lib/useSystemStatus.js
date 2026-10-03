import { useCallback, useEffect, useRef, useState } from 'react'
import { getSystemStatus, subscribeSystemState, clockOffset } from './maintenance.js'

/* The live system status for a panel: read at load, whenever the tab regains focus,
   every 30 s, and the moment the Super Admin changes it (Realtime). Also gives the
   server's clock, for countdowns. If the server can't be reached the last status stays. */
export function useSystemStatus({ pollMs = 30000 } = {}) {
  const [status, setStatus] = useState(null)
  const offset = useRef(0)

  const refresh = useCallback(async () => {
    try {
      const s = await getSystemStatus()
      offset.current = clockOffset(s)
      setStatus(s)
      return s
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, pollMs)
    const unsub = subscribeSystemState(refresh)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(t); unsub(); window.removeEventListener('focus', refresh) }
  }, [refresh, pollMs])

  const serverNow = useCallback(() => Date.now() + offset.current, [])
  return { status, serverNow, refresh }
}

/* Re-renders every second (for countdowns). */
export function useTick(active = true) {
  const [, setN] = useState(0)
  useEffect(() => {
    if (!active) return undefined
    const t = setInterval(() => setN((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [active])
}
