import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { useAuth } from './auth.jsx'

/* Which single agency the Agency panel is scoped to — never user-switchable,
   only ever resolved:
   - agency_manager: fixed to their staff_roles.agency_id (RLS enforces it too).
   - sub_admin: the first agency they own (agencies.sub_admin_id), or their
     legacy staff_roles.agency_id. RLS (manages_agency) enforces the same set.
   - super_admin / admin browsing the panel: the first approved (active)
     agency. No switcher is offered to anyone — a login only ever sees the
     one agency it resolves to. */
const Ctx = createContext(null)
export const useAgencyScope = () => useContext(Ctx)

export function AgencyScopeProvider({ children }) {
  const { staffRole, user } = useAuth()
  const isSub = staffRole?.role === 'sub_admin'
  const fixedId = isSub ? null : (staffRole?.agency_id || null)
  const resolved = !fixedId

  const [agencyId, setAgencyIdState] = useState(null)
  const [agencyName, setAgencyName] = useState('')
  const [hasAny, setHasAny] = useState(true)

  useEffect(() => {
    if (fixedId) {
      supabase.from('agencies').select('name').eq('id', fixedId).maybeSingle()
        .then(({ data }) => { setAgencyIdState(fixedId); setAgencyName(data?.name || 'Your agency'); setHasAny(true) })
      return
    }
    if (isSub && !user?.id) return
    let q = supabase.from('agencies').select('id, name').order('name')
    if (isSub) {
      q = q.or(`sub_admin_id.eq.${user.id}${staffRole.agency_id ? `,id.eq.${staffRole.agency_id}` : ''}`)
    } else {
      // super_admin/admin browsing the panel — only an agency a platform
      // admin has actually approved is a real place to "be"; a pending one
      // isn't live yet.
      q = q.eq('status', 'active')
    }
    q.then(({ data }) => {
      const first = (data || [])[0]
      setAgencyIdState(first?.id || null)
      setAgencyName(first?.name || '')
      setHasAny(!!first)
    })
  }, [fixedId, isSub, user?.id, staffRole?.agency_id])

  return (
    <Ctx.Provider value={{ agencyId, agencyName, resolved, isSub, hasAny }}>
      {children}
    </Ctx.Provider>
  )
}

/* Drop at the top of each Agency-panel page — read-only label, no switcher.
   Only shown when the agency wasn't the account's own fixed one (an
   agency_manager never sees this; its own agency needs no explaining). */
export function AgencyScopeBar() {
  const scope = useAgencyScope()
  if (!scope) return null
  const { agencyName, resolved, isSub, hasAny } = scope
  if (!resolved) return null

  if (!hasAny) {
    return (
      <div className="card mb-16"><div className="card__body" style={{ fontSize: 13, color: 'var(--text-soft)' }}>
        {isSub
          ? <>You don't own any agencies yet — add one under <b>Admin Management → Agency</b>.</>
          : <>No agencies exist yet — create one from the Master panel (<b>Agency Management</b>) before using this panel.</>}
      </div></div>
    )
  }

  return (
    <div className="card mb-16">
      <div className="card__body hstack" style={{ gap: 10 }}>
        <span className="stat__tile tile-green" style={{ width: 34, height: 34 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1" /></svg>
        </span>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Agency</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{agencyName || '—'}</div>
        </div>
      </div>
    </div>
  )
}
