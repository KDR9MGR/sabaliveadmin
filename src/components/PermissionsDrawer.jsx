import { useEffect, useState } from 'react'
import { Drawer, Button, useToast } from './ui.jsx'
import { useAuth } from '../lib/auth.jsx'
import { CAPABILITIES, roleBaseline, effectivePermissions, canGrant, LOWER_ROLE_GRANTS } from '../lib/capabilities.js'
import { setStaffPermissions, getStaffAccess } from '../lib/accounts.js'

/* Per-account capability overrides. Toggles start at the account's effective
   value; the role baseline is shown as helper text. Only keys that differ
   from the baseline are persisted. Enforcement: the UI hides gated nav/actions
   and the privileged RPCs re-check via has_capability() (deny-only). */
export default function PermissionsDrawer({ account, onClose, onSaved }) {
  const toast = useToast()
  const { staffRole, can } = useAuth()
  const isSuper = staffRole?.role === 'super_admin'
  // a Master can only hand out what they hold themselves (set_staff_permissions enforces it too)
  const lacks = (k) => !isSuper && !can(k)
  const base = roleBaseline(account.roleRaw)
  const [vals, setVals] = useState(() => effectivePermissions({ role: account.roleRaw, permissions: account.permissions }))
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }))
  const locked = (k) => !vals[k] && (lacks(k) || (!base[k] && !canGrant(account.roleRaw, k)))

  const save = async () => {
    setBusy(true)
    try {
      const delta = {}
      for (const c of CAPABILITIES) {
        if (!!vals[c.key] !== !!base[c.key]) delta[c.key] = !!vals[c.key]
      }
      await setStaffPermissions(account.id, delta)
      toast(`Permissions updated for ${account.name}`)
      onSaved()
    } catch (e) {
      toast(e?.message || 'Could not save permissions')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => setVals(Object.fromEntries(CAPABILITIES.map((c) => [c.key, !!base[c.key]])))
  const groups = [...new Set(CAPABILITIES.map((c) => c.group))]
  const changed = CAPABILITIES.some((c) => !!vals[c.key] !== !!base[c.key])

  return (
    <Drawer
      title={`Permissions — ${account.name}`}
      onClose={busy ? () => {} : onClose}
      footer={<>
        <Button onClick={reset} disabled={busy || !changed}>Reset to role default</Button>
        <Button variant="primary" icon={busy ? 'refresh' : 'check'} disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </>}
    >
      <p className="muted" style={{ fontSize: 12.5, marginBottom: 4 }}>
        Baseline comes from the <b>{account.role}</b> role. Turning a capability <b>off</b> is enforced everywhere
        (menu, screens and the database). {account.roleRaw === 'admin'
          ? <>Turning one <b>on</b> adds that menu and the database already allows a Master to do it.</>
          : <>The role only sets the default — turning a switch <b>on</b> gives this account that capability whatever its panel: it adds a <b>Granted access</b> entry to its menu that opens just that page, and the database allows that feature's data for this account. Changes reach a signed-in account within a minute.</>}
      </p>
      {groups.map((g) => (
        <div key={g} style={{ marginTop: 14 }}>
          <div className="nav-group__label" style={{ padding: '0 0 6px' }}>{g}</div>
          {CAPABILITIES.filter((c) => c.group === g).map((c) => (
            <div className="toggle-row" key={c.key}>
              <div>
                <div className="t-title">{c.label}</div>
                <div className="t-desc">Role default: {base[c.key] ? 'allowed' : 'denied'}
                  {(!!vals[c.key] !== !!base[c.key]) && <span style={{ color: 'var(--warning)' }}> · overridden</span>}
                  {lacks(c.key) && <span> · {vals[c.key] ? 'you do not hold this yourself' : 'you do not hold this yourself, so you cannot give it'}</span>}
                  {!lacks(c.key) && !base[c.key] && !canGrant(account.roleRaw, c.key) && <span> · {vals[c.key] ? 'has no effect for this role — switch off to clear it' : 'not available for this role'}</span>}
                  {!base[c.key] && account.roleRaw !== 'admin' && LOWER_ROLE_GRANTS[c.key]?.roles.includes(account.roleRaw) && <span style={{ color: 'var(--text-soft)' }}> · gives: {LOWER_ROLE_GRANTS[c.key].gives}</span>}
                </div>
              </div>
              <label className="toggle" style={locked(c.key) ? { opacity: 0.4 } : undefined}>
                <input type="checkbox" checked={!!vals[c.key]} disabled={locked(c.key)} onChange={(e) => set(c.key, e.target.checked)} />
                <span className="track" /><span className="thumb" />
              </label>
            </div>
          ))}
        </div>
      ))}
    </Drawer>
  )
}

/* Same drawer for a row that only knows the account's id (Master's Country / Sub Admin and Agency lists):
   loads the role and current permissions first. */
export function PermissionsFor({ userId, name, onClose, onSaved }) {
  const [account, setAccount] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    getStaffAccess(userId).then((a) => setAccount({ ...a, id: userId, name })).catch((e) => setError(e?.message || 'Could not load this account'))
  }, [userId, name])
  if (!account) {
    return (
      <Drawer title={`Permissions — ${name}`} onClose={onClose}>
        <div className="muted" style={{ fontSize: 13 }}>{error || 'Loading…'}</div>
      </Drawer>
    )
  }
  return <PermissionsDrawer account={account} onClose={onClose} onSaved={onSaved} />
}
