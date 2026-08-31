import { useNavigate, useRouteError } from 'react-router-dom'
import { PageHeader, Card, Button, KV, EmptyState, useToast } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'

/* ------------------------------------------------------------------ My Profile */
export function Profile({ panel = 'Master / Admin' }) {
  const toast = useToast()
  return (
    <>
      <PageHeader title="My Profile" crumbs={['Home', 'Account', 'Profile']} />
      <div className="grid dash">
        <div className="vstack" style={{ gap: 16 }}>
          <Card title="Account details">
            <div className="form-grid">
              <div className="field"><label>Full name</label><input className="input" defaultValue="Mehardeep" /></div>
              <div className="field"><label>Email</label><input className="input" defaultValue="mehardeep@stonelivepro.com" /></div>
              <div className="field"><label>Phone</label><input className="input" defaultValue="+91 90000 12345" /></div>
              <div className="field"><label>Role</label><input className="input" defaultValue="Super Admin" disabled /></div>
              <div className="field full"><label>Bio</label><textarea className="textarea" defaultValue="Platform administrator." /></div>
            </div>
            <div className="hstack mt-16" style={{ justifyContent: 'flex-end' }}>
              <Button variant="primary" icon="check" onClick={() => toast('Profile updated')}>Save</Button>
            </div>
          </Card>
          <Card title="Change password">
            <div className="form-grid">
              <div className="field"><label>Current password</label><input className="input" type="password" placeholder="••••••••" /></div>
              <div className="field" />
              <div className="field"><label>New password</label><input className="input" type="password" placeholder="••••••••" /></div>
              <div className="field"><label>Confirm new password</label><input className="input" type="password" placeholder="••••••••" /></div>
            </div>
            <div className="hstack mt-16" style={{ justifyContent: 'flex-end' }}>
              <Button variant="primary" icon="key" onClick={() => toast('Password changed')}>Update password</Button>
            </div>
          </Card>
        </div>
        <div className="vstack" style={{ gap: 16 }}>
          <Card>
            <div className="center">
              <span className="avatar avatar--xl" style={{ margin: '0 auto' }}>M</span>
              <h3 style={{ marginTop: 12 }}>Mehardeep</h3>
              <div className="muted" style={{ fontSize: 12 }}>Super Admin · {panel} panel</div>
              <Button size="sm" icon="upload" style={{ marginTop: 12 }} onClick={() => toast('Choose photo')}>Change photo</Button>
            </div>
          </Card>
          <Card title="Security">
            <div className="toggle-row"><div><div className="t-title">Two-factor auth</div><div className="t-desc">Authenticator app</div></div>
              <label className="toggle"><input type="checkbox" defaultChecked /><span className="track" /><span className="thumb" /></label></div>
            <div className="toggle-row"><div><div className="t-title">Login alerts</div><div className="t-desc">Email on new device</div></div>
              <label className="toggle"><input type="checkbox" defaultChecked /><span className="track" /><span className="thumb" /></label></div>
            <KV rows={[['Last login', 'Today, 09:14 · Mumbai'], ['Session', 'Chrome on macOS']]} />
          </Card>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Login */
export function Login() {
  const nav = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
      <div className="card" style={{ width: 'min(400px, 100%)', padding: 32 }}>
        <div className="hstack" style={{ gap: 10, marginBottom: 20 }}>
          <img src="/favicon.svg" width={34} height={34} alt="" />
          <b style={{ fontSize: 18 }}>Stone Livepro</b>
        </div>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Admin sign in</h1>
        <p className="muted" style={{ fontSize: 13, marginBottom: 22 }}>Authorized personnel only.</p>
        <div className="vstack" style={{ gap: 14 }}>
          <div className="field"><label>Email</label><input className="input" defaultValue="mehardeep@stonelivepro.com" /></div>
          <div className="field"><label>Password</label><input className="input" type="password" defaultValue="password" /></div>
          <label className="checkbox"><input type="checkbox" /> Remember this device</label>
          <Button variant="primary" icon="logout" onClick={() => nav('/admin')}>Sign in</Button>
          <div className="center muted" style={{ fontSize: 12 }}>Protected by 2FA · <a href="#" style={{ color: 'var(--primary)' }}>Forgot password?</a></div>
        </div>
        <div className="menu-sep" style={{ margin: '20px 0' }} />
        <div className="vstack gap-8">
          <div className="muted center" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick access (demo)</div>
          <div className="hstack" style={{ gap: 8 }}>
            <Button size="sm" onClick={() => nav('/super')}>Super Admin</Button>
            <Button size="sm" onClick={() => nav('/admin')}>Master</Button>
            <Button size="sm" onClick={() => nav('/agency')}>Agency</Button>
          </div>
        </div>
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
