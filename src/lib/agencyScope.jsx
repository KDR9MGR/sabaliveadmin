import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { useAuth } from './auth.jsx'

/* Which agency the Agency panel is currently scoped to.
   - agency_manager / sub_admin: fixed to their staff_roles.agency_id (RLS enforces it too).
   - super_admin / admin browsing the panel: pick one (persisted); everything scopes to it. */
const Ctx = createContext(null)
export const useAgencyScope = () => useContext(Ctx)

const KEY = 'sabalive.agencyScope'

export function AgencyScopeProvider({ children }) {
  const { staffRole } = useAuth()
  const fixedId = staffRole?.agency_id || null
  const canPick = !fixedId

  const [agencies, setAgencies] = useState([])
  const [picked, setPicked] = useState(() => {
    try { return localStorage.getItem(KEY) || null } catch { return null }
  })
  const [fixedName, setFixedName] = useState('')

  useEffect(() => {
    if (fixedId) {
      supabase.from('agencies').select('name').eq('id', fixedId).maybeSingle()
        .then(({ data }) => setFixedName(data?.name || 'Your agency'))
      return
    }
    supabase.from('agencies').select('id, name').order('name').then(({ data }) => {
      setAgencies(data || [])
      setPicked((cur) => cur || data?.[0]?.id || null)
    })
  }, [fixedId])

  const agencyId = fixedId || picked
  const agencyName = fixedId ? fixedName : (agencies.find((a) => a.id === agencyId)?.name || '')

  const setAgencyId = (id) => {
    setPicked(id)
    try { localStorage.setItem(KEY, id) } catch { /* ignore */ }
  }

  return (
    <Ctx.Provider value={{ agencyId, agencyName, canPick, agencies, setAgencyId }}>
      {children}
    </Ctx.Provider>
  )
}

/* Drop at the top of each Agency-panel page. */
export function AgencyScopeBar() {
  const scope = useAgencyScope()
  if (!scope) return null
  const { agencyId, agencyName, canPick, agencies, setAgencyId } = scope

  if (canPick && !agencies.length) {
    return (
      <div className="card mb-16"><div className="card__body" style={{ fontSize: 13, color: 'var(--text-soft)' }}>
        No agencies exist yet — create one from the Master panel (<b>Agency Management</b>) before using this panel.
      </div></div>
    )
  }

  return (
    <div className="card mb-16">
      <div className="card__body hstack spread wrap" style={{ gap: 12 }}>
        <div className="hstack" style={{ gap: 10 }}>
          <span className="stat__tile tile-green" style={{ width: 34, height: 34 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1" /></svg>
          </span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Agency</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{agencyName || '—'}</div>
          </div>
        </div>
        {canPick && (
          <select className="select" style={{ width: 'auto', minWidth: 200 }} value={agencyId || ''} onChange={(e) => setAgencyId(e.target.value)}>
            {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
      </div>
    </div>
  )
}
