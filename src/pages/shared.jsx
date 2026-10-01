import { useState } from 'react'
import { Navigate, useNavigate, useRouteError } from 'react-router-dom'
import { PageHeader, Card, Button, KV, EmptyState, useToast } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'
import { useSettings } from '../config/settings.jsx'
import { useAuth, ROLE_LABEL } from '../lib/auth.jsx'
import { landingPath } from '../components/guards.jsx'

/* ------------------------------------------------------------------ My Profile */
export function Profile({ panel = 'Master / Admin' }) {
  const toast = useToast()
  const { profile, user, staffRole, changePassword } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User'
  const avatarLetter = (displayName.charAt(0) || '?').toUpperCase()
  const email = user?.email || ''
  const username = profile?.username || ''
  const location = profile?.location || ''
  const phone = profile?.phone || ''
  const bio = profile?.bio || ''
  const roleLabel = staffRole?.role
    ? (ROLE_LABEL[staffRole.role] || staffRole.role)
    : '—'

  const handleChangePassword = async () => {
    setPasswordError('')
    if (!currentPassword) {
      setPasswordError('Current password is required')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match')
      return
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password')
      return
    }
    setPasswordBusy(true)
    try {
      const { error } = await changePassword(currentPassword, newPassword)
      if (error) {
        setPasswordError(error.message || 'Failed to change password')
        toast('Failed to change password', { variant: 'danger' })
      } else {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        toast('Password changed')
      }
    } catch (e) {
      setPasswordError(e.message || 'Failed to change password')
      toast('Failed to change password', { variant: 'danger' })
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="My Profile" crumbs={['Home', 'Account', 'Profile']} />
      <div className="grid dash">
        <div className="vstack" style={{ gap: 16 }}>
          <Card title="Account details">
            <div className="form-grid">
              <div className="field">
                <label>Full name</label>
                <input className="input" value={displayName} disabled title="Set when account was created" />
              </div>
              <div className="field">
                <label>Username</label>
                <input className="input" value={username} disabled title="Set when account was created" />
              </div>
              <div className="field">
                <label>Email</label>
                <input className="input" value={email} disabled title="Set when account was created" />
              </div>
              <div className="field">
                <label>Phone</label>
                <input className="input" value={phone} disabled title="Set when account was created" />
              </div>
              <div className="field">
                <label>Role</label>
                <input className="input" value={roleLabel} disabled />
              </div>
              <div className="field">
                <label>Location / Country</label>
                <input className="input" value={location} disabled title="Set when account was created" />
              </div>
              <div className="field full">
                <label>Bio</label>
                <textarea className="textarea" value={bio} disabled title="Set when account was created" />
              </div>
            </div>
            <div className="muted mt-12" style={{ fontSize: 12 }}>
              Account details are set when your account is created and cannot be edited here. Contact a Super Admin if you need changes.
            </div>
          </Card>
          <Card title="Change password">
            <div className="form-grid">
              <div className="field">
                <label>Current password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="field" />
              <div className="field">
                <label>New password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="field">
                <label>Confirm new password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            {passwordError && (
              <div className="badge badge--danger mt-16" style={{ justifyContent: 'flex-start' }}>
                {passwordError}
              </div>
            )}
            <div className="hstack mt-16" style={{ justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                icon={passwordBusy ? 'refresh' : 'key'}
                disabled={passwordBusy}
                onClick={handleChangePassword}
              >
                {passwordBusy ? 'Updating…' : 'Update password'}
              </Button>
            </div>
          </Card>
        </div>
        <div className="vstack" style={{ gap: 16 }}>
          <Card>
            <div className="center">
              <span className="avatar avatar--xl" style={{ margin: '0 auto' }}>{avatarLetter}</span>
              <h3 style={{ marginTop: 12 }}>{displayName}</h3>
              <div className="muted" style={{ fontSize: 12 }}>{roleLabel} · {panel} panel</div>
              <Button size="sm" icon="upload" style={{ marginTop: 12 }} onClick={() => toast('Choose photo')}>Change photo</Button>
            </div>
          </Card>
          <Card title="Security">
            <div className="toggle-row"><div><div className="t-title">Two-factor auth</div><div className="t-desc">Authenticator app</div></div>
              <label className="toggle"><input type="checkbox" defaultChecked /><span className="track" /><span className="thumb" /></label></div>
            <div className="toggle-row"><div><div className="t-title">Login alerts</div><div className="t-desc">Email on new device</div></div>
              <label className="toggle"><input type="checkbox" defaultChecked /><span className="track" /><span className="thumb" /></label></div>
            <KV rows={[['Last login', user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—'], ['Session', 'Active']]} />
          </Card>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Login */
export function Login() {
  const { settings } = useSettings()
  const { signIn, isStaff, loading: authLoading, panel, staffRole } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // already signed in with a staff role -> skip straight to their panel
  if (!authLoading && isStaff) return <Navigate to={landingPath(panel, staffRole)} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: err } = await signIn(email, password)
    setBusy(false)
    if (err) setError(err.message || 'Sign in failed.')
    // on success, useAuth's state updates and the redirect above fires
  }

  return (
    <div className="login">
      <div className="login__aside">
        <div className="hstack" style={{ gap: 12 }}>
          <img src={`${import.meta.env.BASE_URL}icon-192.png`} width={38} height={38} alt="" />
          <div>
            <b style={{ fontSize: 20, display: 'block' }}>{settings.appName}</b>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{settings.tagline}</span>
          </div>
        </div>
        <h2 style={{ fontSize: 24, lineHeight: 1.3, marginTop: 40, maxWidth: 360 }}>
          Sign in to your admin console.
        </h2>
        <p style={{ fontSize: 13, opacity: 0.75, marginTop: 10, maxWidth: 380 }}>
          Your role in <code style={{ background: 'rgba(255,255,255,0.15)', padding: '1px 5px', borderRadius: 4 }}>staff_roles</code> decides which panel you land in after signing in.
        </p>
      </div>

      <div className="login__form">
        <form className="card" style={{ width: 'min(380px, 100%)', padding: 32 }} onSubmit={submit}>
          <h1 style={{ fontSize: 20, marginBottom: 4 }}>Admin sign in</h1>
          <p className="muted" style={{ fontSize: 13, marginBottom: 22 }}>Authorized personnel only.</p>
          <div className="vstack" style={{ gap: 14 }}>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" autoComplete="username" required
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && (
              <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start' }}>{error}</div>
            )}
            <Button type="submit" variant="primary" icon={busy ? 'refresh' : 'logout'} disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
            <div className="center muted" style={{ fontSize: 12 }}>
              No account yet? Ask a Super Admin to grant you a role in <code>staff_roles</code>.
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Not found / error */
export function NotFound() {
  const nav = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card><div className="card__body">
        <EmptyState icon="helpCircle" title="Page not found" text="The screen you’re looking for doesn’t exist or has moved." />
        <div className="center"><Button variant="primary" icon="dashboard" onClick={() => nav('/admin')}>Go to dashboard</Button></div>
      </div></Card>
    </div>
  )
}

export function RouteError() {
  const err = useRouteError()
  return (
    <div style={{ padding: 40 }}>
      <Card><div className="card__body">
        <h3 style={{ marginBottom: 8 }}>Something went wrong</h3>
        <pre className="mono" style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--danger)' }}>{String(err?.message || err)}</pre>
      </div></Card>
    </div>
  )
}

/* ------------------------------------------------------------------ generic placeholder */
export function Placeholder({ title }) {
  return (
    <>
      <PageHeader title={title} crumbs={['Home', title]} />
      <Card><div className="card__body"><EmptyState icon="layers" title={`${title} — UI coming together`} text="This screen is wired into navigation. Layout and data hook-up in progress." /></div></Card>
    </>
  )
}
