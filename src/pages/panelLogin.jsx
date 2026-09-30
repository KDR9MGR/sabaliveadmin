/* Branded per-panel login pages for the Global Admin > Country Admin >
   Sub Admin > Agency hierarchy. Visually distinct per panel, but the actual
   sign-in is identical to the main /login page — same signIn() call, same
   role-based landingPath() redirect. Signing in here as, say, an
   agency_manager still lands you on the Agency panel, not "whichever page
   you happened to sign in from" — the quick-link buttons below the form
   are just navigation to a sibling panel's own login page, not a bypass.
   The Agency panel keeps its own login page (/panel-agency/login) for agency
   accounts, and every login page links to all the others. */
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useSettings } from '../config/settings.jsx'
import { landingPath } from '../components/guards.jsx'
import { PANELS } from '../config/nav.js'
import { Button } from '../components/ui.jsx'

function PanelLoginPage({ panelKey, quickLinks = [] }) {
  const nav = useNavigate()
  const { settings } = useSettings()
  const { signIn, isStaff, loading: authLoading, panel, staffRole } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const p = PANELS[panelKey]

  if (!authLoading && isStaff) return <Navigate to={landingPath(panel, staffRole)} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: err } = await signIn(email, password)
    setBusy(false)
    if (err) setError(err.message || 'Sign in failed.')
  }

  return (
    <div
      style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24,
        background: `radial-gradient(circle at 50% -10%, ${p.color}33 0%, transparent 60%), linear-gradient(160deg, #1a1030 0%, #0d0818 100%)`,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: 'min(400px, 100%)', padding: '36px 32px', borderRadius: 20,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
          backdropFilter: 'blur(18px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', color: '#fff',
        }}
      >
        <div className="center">
          <img src={`${import.meta.env.BASE_URL}icon-192.png`} width={48} height={48} alt="" style={{ borderRadius: 12 }} />
          <h1 style={{ fontSize: 22, margin: '14px 0 2px', color: '#fff' }}>{p.label}</h1>
          <p style={{ fontSize: 13, opacity: 0.7, margin: 0, color: '#fff' }}>Sign in to start your session</p>
        </div>

        <div className="vstack" style={{ gap: 14, marginTop: 28 }}>
          <input
            className="input" type="email" placeholder="Email" required autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#fff' }}
          />
          <input
            className="input" type="password" placeholder="Password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#fff' }}
          />
          {error && (
            <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start' }}>{error}</div>
          )}
          <Button type="submit" variant="primary" icon={busy ? 'refresh' : 'logout'} disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Signing in…' : 'Sign In'}
          </Button>
        </div>

        {quickLinks.length > 0 && (
          <>
            <div className="center" style={{ margin: '22px 0 16px', fontSize: 12, opacity: 0.6 }}>- OR -</div>
            <div className="vstack" style={{ gap: 10 }}>
              {quickLinks.map((q) => {
                const target = PANELS[q.panelKey]
                return (
                  <button
                    key={q.panelKey} type="button" onClick={() => nav(`${target.base}/login`)}
                    className="btn"
                    style={{ width: '100%', justifyContent: 'center', background: target.color, color: '#fff', border: 'none' }}
                  >
                    Sign in as {target.label}
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div className="center" style={{ fontSize: 11.5, marginTop: 20, opacity: 0.6, color: '#fff' }}>
          {settings.appName} · Authorized personnel only
        </div>
      </form>
    </div>
  )
}

/* Every panel links to all the others, not just the ones below it in the
   hierarchy — the quick-links are cross-navigation between login pages, not a
   reflection of who reports to whom. */
const ALL_PANEL_KEYS = ['global-admin', 'country-admin', 'sub-admin', 'panel-agency']
const otherPanels = (self) => ALL_PANEL_KEYS.filter((k) => k !== self).map((panelKey) => ({ panelKey }))

export const GlobalAdminLogin = () => (
  <PanelLoginPage panelKey="global-admin" quickLinks={otherPanels('global-admin')} />
)
export const CountryAdminLogin = () => (
  <PanelLoginPage panelKey="country-admin" quickLinks={otherPanels('country-admin')} />
)
export const SubAdminLogin = () => (
  <PanelLoginPage panelKey="sub-admin" quickLinks={otherPanels('sub-admin')} />
)
export const AgencyLogin = () => (
  <PanelLoginPage panelKey="panel-agency" quickLinks={otherPanels('panel-agency')} />
)
