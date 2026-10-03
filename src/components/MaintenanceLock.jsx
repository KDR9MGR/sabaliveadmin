import { useEffect } from 'react'
import MaintenanceCard from './MaintenanceCard.jsx'
import { useSystemStatus } from '../lib/useSystemStatus.js'
import { isLockedForStaff } from '../lib/maintenance.js'
import { Button } from './ui.jsx'

/* Full screen, over a whole panel, for a panel account that maintenance (or a
   lockdown) has locked out. It keeps asking the server and lets them back in the
   moment it lifts. `role` is that account's staff role, if known; if the lock stopped
   even that lookup, the server's own refusal is the reason for being here. */
export default function MaintenanceLock({ role, onSignOut, onUnlocked, forced = false }) {
  const { status, serverNow, refresh } = useSystemStatus({ pollMs: 10000 })

  const stillLocked = status ? (forced ? status.status === 'maintenance' || status.status === 'lockdown' : isLockedForStaff(status, role)) : true
  useEffect(() => {
    if (status && !stillLocked) onUnlocked?.()
  }, [status, stillLocked, onUnlocked])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--bg, #f6f7fb)', display: 'grid', placeItems: 'center', padding: 24, overflow: 'auto' }}>
      <div style={{ width: '100%' }}>
        {status
          ? <MaintenanceCard status={status} serverNow={serverNow} />
          : <div className="muted" style={{ textAlign: 'center' }}>Checking…</div>}
        <div className="hstack" style={{ justifyContent: 'center', gap: 10, marginTop: 24 }}>
          <Button icon="refresh" onClick={refresh}>Check again</Button>
          {onSignOut && <Button onClick={onSignOut}>Sign out</Button>}
        </div>
      </div>
    </div>
  )
}
