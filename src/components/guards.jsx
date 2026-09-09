import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { PANELS } from '../config/nav.js'
import { panelFromHostname } from '../lib/panelHost.js'
import { Button } from './ui.jsx'
import Icon from './Icon.jsx'

/* Where a signed-in staffer should land: honour the panel subdomain when the
   role is allowed there (super_admin may browse all panels), otherwise the
   panel their role resolves to. */
export function landingPath(panel, staffRole) {
  const wanted = panelFromHostname()
  const canBrowseAll = staffRole?.role === 'super_admin'
  const target = wanted && (canBrowseAll || wanted === panel) ? wanted : panel
  return PANELS[target]?.base ?? '/login'
}

export function FullscreenLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <div className="hstack" style={{ gap: 10, color: 'var(--text-muted)' }}>
        <Icon name="refresh" size={18} />
        Loading…
      </div>
    </div>
  )
}

function NoAccessScreen({ onSignOut }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
      <div className="card" style={{ width: 'min(420px, 100%)', padding: 32, textAlign: 'center' }}>
        <div className="empty__ico" style={{ margin: '0 auto 14px', background: 'var(--danger-bg)', color: 'var(--danger)' }}>
          <Icon name="lock" size={24} />
        </div>
        <h3 style={{ marginBottom: 6 }}>No admin access</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
          You're signed in, but this account has no entry in <code>staff_roles</code> —
          it isn't provisioned for Super Admin, Master/Admin, or Agency access.
          Ask a Super Admin to grant a role, then sign in again.
        </p>
        <Button variant="primary" icon="logout" onClick={onSignOut}>Sign out</Button>
      </div>
    </div>
  )
}

/* Gate: must be signed in AND have a staff_roles row. */
export function RequireAuth({ children }) {
  const { loading, user, isStaff, signOut } = useAuth()
  if (loading) return <FullscreenLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!isStaff) return <NoAccessScreen onSignOut={signOut} />
  return children
}

/* Gate: the signed-in staffer's role must resolve to this panel — otherwise
   bounce them to the panel their role actually belongs to. Super Admins are
   admin-or-above for every RLS check in the DB, so they may browse all three
   panels via the switcher instead of being locked to /super. */
export function RequirePanel({ panel, children }) {
  const { panel: myPanel, staffRole } = useAuth()
  const canBrowseAll = staffRole?.role === 'super_admin'
  if (myPanel !== panel && !canBrowseAll) return <Navigate to={PANELS[myPanel]?.base ?? '/login'} replace />
  return children
}

/* Gate a route (or subtree) on a capability. A staffer lacking it is bounced
   to their panel base — the sidebar already hides these links, this stops
   deep-linking / stale tabs. Super Admins pass everything. */
export function RequireCap({ cap, children }) {
  const { can, panel } = useAuth()
  if (cap && !can(cap)) return <Navigate to={PANELS[panel]?.base ?? '/login'} replace />
  return children ?? <Outlet />
}

/* "/" — send a resolved staffer straight to their panel, everyone else to /login. */
export function RootRedirect() {
  const { loading, isStaff, panel, staffRole } = useAuth()
  if (loading) return <FullscreenLoader />
  if (isStaff) return <Navigate to={landingPath(panel, staffRole)} replace />
  return <Navigate to="/login" replace />
}
