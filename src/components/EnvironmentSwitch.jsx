import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { ConfirmDialog } from './ui.jsx'
import { useAuth } from '../lib/auth.jsx'
import {
  activeEnvironment, canSwitchEnvironment, isStagingEnvironment, switchEnvironment, ENV_LABEL,
} from '../lib/environments.js'

const COLOR = { production: '#16a34a', staging: '#ea580c' }

/* Top-bar switch between the live project and the staging (test) project. Only a Master or Super Admin sees it, and
   only on a build that knows the staging address. The page reloads into the other project, where you sign in with
   that project's own account (once; each project remembers its own sign-in). */
export function EnvironmentSwitch() {
  const { staffRole } = useAuth()
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [])

  const role = staffRole?.role
  if (!canSwitchEnvironment || (role !== 'super_admin' && role !== 'admin')) return null

  const cur = activeEnvironment.key
  const color = COLOR[cur]
  const other = cur === 'production' ? 'staging' : 'production'

  return (
    <div className="pos-rel" ref={ref}>
      <button className="panel-switch" onClick={() => setOpen((o) => !o)} style={{ borderColor: color, color }} title="Which project this panel is showing">
        <span className="panel-switch__dot" style={{ background: color }} />
        <span className="hide-sm">{ENV_LABEL[cur]}</span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div className="menu-pop" style={{ minWidth: 276 }}>
          <div className="menu-label">Switch environment</div>
          {['production', 'staging'].map((k) => (
            <button key={k} onClick={() => { setOpen(false); if (k !== cur) setTarget(k) }}>
              <span className="panel-switch__dot" style={{ background: COLOR[k] }} />
              <span>
                {ENV_LABEL[k]}
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                  {k === 'production' ? 'The live app: real people, real coins' : 'The test copy: fake accounts and data'}
                </span>
              </span>
              {k === cur && <Icon name="check" size={15} style={{ marginLeft: 'auto', color: COLOR[k], flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
      {target && (
        <ConfirmDialog
          title={`Switch to ${ENV_LABEL[target]}?`}
          danger={target === 'production'}
          confirmLabel={`Switch to ${ENV_LABEL[target]}`}
          message={target === 'production'
            ? 'You will be working on the LIVE project: real users, real coins, real lives. The panel reloads and asks you to sign in with your production account (if you are not already).'
            : 'You will be working on the STAGING project: fake accounts and test data, nothing real. The panel reloads and asks you to sign in with a staging account (if you are not already).'}
          onConfirm={() => switchEnvironment(other)}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  )
}

/* A strip across the top whenever the panel is on staging, so nobody mistakes test data for the live app. */
export function StagingBanner() {
  if (!isStagingEnvironment) return null
  return (
    <div style={{ background: '#ea580c', color: '#fff', padding: '5px 16px', fontSize: 12.5, fontWeight: 600, textAlign: 'center', letterSpacing: '0.04em' }}>
      STAGING: test data only, nothing here is real
    </div>
  )
}

/* On the sign-in pages: say which project you are signing in to, and (only once you are on staging) the way back. */
export function EnvironmentNotice({ dark = false }) {
  if (!isStagingEnvironment) return null
  return (
    <div style={{
      margin: '0 0 16px', padding: '8px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
      background: 'rgba(234,88,12,0.16)', color: dark ? '#fdba74' : '#c2410c', border: '1px solid rgba(234,88,12,0.5)',
    }}>
      Signing in to STAGING (test data).
      {canSwitchEnvironment && (
        <button type="button" onClick={() => switchEnvironment('production')}
          style={{ marginLeft: 8, background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}>
          Back to production
        </button>
      )}
    </div>
  )
}
